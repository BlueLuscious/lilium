import type { IReactiveConsumer } from "../contracts/internal/tracking/reactive-consumer.contract.js";
import type { IReactiveSource } from "../contracts/internal/tracking/reactive-source.contract.js";
import type { IReactiveTracker } from "../contracts/internal/tracking/reactive-tracker.contract.js";
import type { TReactiveComputation } from "../types/internal/tracking/reactive-computation.type.js";
import { reactiveTrackingContext } from "./reactive-tracking-context.manager.js";

/**
 * @description Runtime-isolated implementation of transactional dependency tracking.
 * @remarks Graph edges are committed only after successful collection. Mutable source and
 * consumer collections remain private and are never exposed through contracts or public APIs.
 */
export class ReactiveTrackerRuntime implements IReactiveTracker {
    /** @description Committed dependencies indexed by reactive consumer identity. */
    readonly #dependencies = new WeakMap<IReactiveConsumer, Set<IReactiveSource>>();

    /** @description Committed consumers indexed by reactive source identity. */
    readonly #consumers = new WeakMap<IReactiveSource, Set<IReactiveConsumer>>();

    /**
     * @description Executes a consumer and atomically replaces its dependencies on success.
     * @typeParam T - Value returned by the tracked computation.
     * @param consumer - Runtime-owned consumer collecting dynamic dependencies.
     * @param computation - Synchronous computation executed with the consumer active.
     * @returns The value returned by the computation.
     */
    collect<T>(consumer: IReactiveConsumer, computation: TReactiveComputation<T>): T {
        this.#assertConsumer(consumer);
        const candidateDependencies = new Set<IReactiveSource>();
        const result = reactiveTrackingContext.collect(
            this,
            consumer,
            candidateDependencies,
            computation,
        );

        this.#replaceDependencies(consumer, candidateDependencies);
        return result;
    }

    /**
     * @description Records a source read for the active transactional collection.
     * @param source - Runtime-owned reactive source being read.
     * @returns Nothing.
     */
    track(source: IReactiveSource): void {
        this.#assertSource(source);
        reactiveTrackingContext.track(this, source);
    }

    /**
     * @description Invalidates a stable snapshot of consumers connected to one source.
     * @param source - Runtime-owned source whose accepted value changed.
     * @returns Nothing.
     */
    invalidate(source: IReactiveSource): void {
        this.#assertSource(source);
        reactiveTrackingContext.invalidateCandidate(this, source);
        const consumers = this.#consumers.get(source);

        if (consumers === undefined) {
            return;
        }

        for (const consumer of [...consumers]) {
            consumer.invalidate();
        }
    }

    /**
     * @description Removes every committed graph edge owned by a consumer.
     * @param consumer - Runtime-owned consumer being disconnected.
     * @returns Nothing.
     */
    disconnect(consumer: IReactiveConsumer): void {
        this.#assertConsumer(consumer);
        const dependencies = this.#dependencies.get(consumer);

        if (dependencies === undefined) {
            return;
        }

        for (const source of dependencies) {
            this.#removeConsumer(source, consumer);
        }

        this.#dependencies.delete(consumer);
    }

    /**
     * @description Removes every committed graph edge connected to one source.
     * @param source - Runtime-owned source being disconnected during disposal.
     * @returns Nothing.
     */
    disconnectSource(source: IReactiveSource): void {
        this.#assertSource(source);
        const consumers = this.#consumers.get(source);

        if (consumers === undefined) {
            return;
        }

        for (const consumer of consumers) {
            const dependencies = this.#dependencies.get(consumer);

            if (dependencies === undefined) {
                continue;
            }

            dependencies.delete(source);

            if (dependencies.size === 0) {
                this.#dependencies.delete(consumer);
            }
        }

        this.#consumers.delete(source);
    }

    /**
     * @description Executes an operation with reactive dependency collection suspended.
     * @typeParam T - Value returned by the untracked computation.
     * @param computation - Synchronous operation executed without an active consumer.
     * @returns The value returned by the computation.
     */
    untrack<T>(computation: TReactiveComputation<T>): T {
        return reactiveTrackingContext.untrack(computation);
    }

    /**
     * @description Verifies that a consumer belongs to this exact tracker instance.
     * @param consumer - Consumer identity being validated.
     * @returns Nothing.
     */
    #assertConsumer(consumer: IReactiveConsumer): void {
        if (consumer.runtime.tracker !== this) {
            throw new Error("The reactive consumer belongs to another runtime.");
        }
    }

    /**
     * @description Verifies that a source belongs to this exact tracker instance.
     * @param source - Source identity being validated.
     * @returns Nothing.
     */
    #assertSource(source: IReactiveSource): void {
        if (source.runtime.tracker !== this) {
            throw new Error("The reactive source belongs to another runtime.");
        }
    }

    /**
     * @description Removes one consumer from a source and releases an empty subscriber set.
     * @param source - Source losing the graph edge.
     * @param consumer - Consumer disconnected from the source.
     * @returns Nothing.
     */
    #removeConsumer(source: IReactiveSource, consumer: IReactiveConsumer): void {
        const consumers = this.#consumers.get(source);

        if (consumers === undefined) {
            return;
        }

        consumers.delete(consumer);

        if (consumers.size === 0) {
            this.#consumers.delete(source);
        }
    }

    /**
     * @description Reconciles one successful candidate set against committed graph edges.
     * @param consumer - Consumer whose dynamic dependencies completed successfully.
     * @param candidateDependencies - Deduplicated sources read by the successful computation.
     * @returns Nothing.
     */
    #replaceDependencies(
        consumer: IReactiveConsumer,
        candidateDependencies: Set<IReactiveSource>,
    ): void {
        const previousDependencies = this.#dependencies.get(consumer);

        if (previousDependencies !== undefined) {
            for (const source of previousDependencies) {
                if (!candidateDependencies.has(source)) {
                    this.#removeConsumer(source, consumer);
                }
            }
        }

        for (const source of candidateDependencies) {
            if (previousDependencies?.has(source) === true) {
                continue;
            }

            let consumers = this.#consumers.get(source);

            if (consumers === undefined) {
                consumers = new Set<IReactiveConsumer>();
                this.#consumers.set(source, consumers);
            }

            consumers.add(consumer);
        }

        if (candidateDependencies.size === 0) {
            this.#dependencies.delete(consumer);
            return;
        }

        this.#dependencies.set(consumer, candidateDependencies);
    }
}
