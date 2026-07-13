import type { IReactiveConsumer } from "../contracts/internal/tracking/reactive-consumer.contract.js";
import type { IReactiveSource } from "../contracts/internal/tracking/reactive-source.contract.js";
import type { IReactiveTracker } from "../contracts/internal/tracking/reactive-tracker.contract.js";
import type { TReactiveComputation } from "../types/internal/tracking/reactive-computation.type.js";

/**
 * @description Process-wide synchronous stack for active reactive dependency collection.
 * @remarks Graph storage remains isolated in each tracker. Sharing only the active stack
 * allows a source owned by another runtime to detect and reject a tracked cross-runtime read.
 */
class ReactiveTrackingContextManager {
    /** @description Consumer currently collecting dependencies, or `null` when suspended. */
    #consumer: IReactiveConsumer | null = null;

    /** @description Candidate dependency set for the active transactional collection. */
    #dependencies: Set<IReactiveSource> | null = null;

    /** @description Tracker that owns the active consumer and candidate dependencies. */
    #tracker: IReactiveTracker | null = null;

    /**
     * @description Executes an operation as one transactional dependency collection frame.
     * @typeParam T - Value returned by the tracked computation.
     * @param tracker - Runtime-isolated tracker that owns the frame.
     * @param consumer - Consumer collecting candidate dependencies.
     * @param dependencies - Empty candidate set populated by tracked source reads.
     * @param computation - Synchronous operation executed inside the frame.
     * @returns The value returned by the tracked computation.
     */
    collect<T>(
        tracker: IReactiveTracker,
        consumer: IReactiveConsumer,
        dependencies: Set<IReactiveSource>,
        computation: TReactiveComputation<T>,
    ): T {
        const previousTracker = this.#tracker;
        const previousConsumer = this.#consumer;
        const previousDependencies = this.#dependencies;

        this.#tracker = tracker;
        this.#consumer = consumer;
        this.#dependencies = dependencies;

        try {
            return computation();
        } finally {
            this.#tracker = previousTracker;
            this.#consumer = previousConsumer;
            this.#dependencies = previousDependencies;
        }
    }

    /**
     * @description Records a source in the active candidate set when tracking is enabled.
     * @param tracker - Tracker through which the source read was reported.
     * @param source - Reactive source read by the active computation.
     * @returns Nothing.
     */
    track(tracker: IReactiveTracker, source: IReactiveSource): void {
        if (this.#consumer === null || this.#dependencies === null) {
            return;
        }

        if (this.#tracker !== tracker || source.runtime !== this.#consumer.runtime) {
            throw new Error("Cannot track reactive dependencies across runtimes.");
        }

        this.#dependencies.add(source);
    }

    /**
     * @description Invalidates the active consumer when it already read a changed source.
     * @remarks Candidate dependencies remain uncommitted; this notification only allows a
     * running effect to reserve a later scheduler cycle after writing a source it consumed.
     * @param tracker - Tracker through which the source change was reported.
     * @param source - Reactive source changed during the active collection attempt.
     * @returns Nothing.
     */
    invalidateCandidate(tracker: IReactiveTracker, source: IReactiveSource): void {
        if (
            this.#tracker === tracker
            && this.#consumer !== null
            && this.#dependencies?.has(source) === true
        ) {
            this.#consumer.invalidate();
        }
    }

    /**
     * @description Executes an operation with dependency collection temporarily suspended.
     * @typeParam T - Value returned by the untracked computation.
     * @param computation - Synchronous operation executed without an active consumer.
     * @returns The value returned by the untracked computation.
     */
    untrack<T>(computation: TReactiveComputation<T>): T {
        const previousTracker = this.#tracker;
        const previousConsumer = this.#consumer;
        const previousDependencies = this.#dependencies;

        this.#tracker = null;
        this.#consumer = null;
        this.#dependencies = null;

        try {
            return computation();
        } finally {
            this.#tracker = previousTracker;
            this.#consumer = previousConsumer;
            this.#dependencies = previousDependencies;
        }
    }
}

/** @description Shared internal stack used to preserve nested reactive execution context. */
export const reactiveTrackingContext = new ReactiveTrackingContextManager();
