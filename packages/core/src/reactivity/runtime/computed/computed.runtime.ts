import type { OwnershipManager } from "../../../ownership/runtime/ownership.manager.js";
import type { Computed } from "../../contracts/computed/computed.contract.js";
import type {
    IReactiveConsumer,
    REACTIVE_CONSUMER_BRAND,
} from "../../contracts/internal/tracking/reactive-consumer.contract.js";
import type { IReactiveRuntimeContext } from "../../contracts/internal/tracking/reactive-runtime-context.contract.js";
import type {
    IReactiveSource,
    REACTIVE_SOURCE_BRAND,
} from "../../contracts/internal/tracking/reactive-source.contract.js";
import type { ComputedFunctionType } from "../../types/computed/computed-function.type.js";

/**
 * @description Internal lazy memoized implementation of the public Computed contract.
 * @remarks The object consumes dynamic dependencies while evaluating and acts as a source
 * for callers. Failed evaluations retain committed cache and dependencies for later retry.
 * @typeParam T - Value produced and cached by the computed operation.
 */
export class ComputedRuntime<T>
implements Computed<T>, IReactiveConsumer, IReactiveSource {
    /** @description Type-only identity required by the internal reactive consumer role. */
    declare readonly [REACTIVE_CONSUMER_BRAND]: true;

    /** @description Type-only identity required by the internal reactive source role. */
    declare readonly [REACTIVE_SOURCE_BRAND]: true;

    /** @description Pure operation used to derive candidate computed values. */
    readonly #computation: ComputedFunctionType<T>;

    /** @description Whether ownership disposal has permanently closed this computed value. */
    #disposed = false;

    /** @description Whether this computed value is currently evaluating its operation. */
    #evaluating = false;

    /** @description Whether at least one evaluation has committed a cached value. */
    #initialized = false;

    /** @description Whether the cached value requires lazy reevaluation on the next read. */
    #stale = true;

    /** @description Last successfully committed computed value. */
    #value!: T;

    /** @description Runtime context that owns both graph roles of this computed value. */
    readonly runtime: IReactiveRuntimeContext;

    /**
     * @description Creates and registers one lazy computed value under the active owner.
     * @param runtime - Runtime-isolated reactive context that owns graph operations.
     * @param ownership - Ownership service receiving this computed value's disposal.
     * @param computation - Pure operation evaluated lazily to derive candidate values.
     */
    constructor(
        runtime: IReactiveRuntimeContext,
        ownership: OwnershipManager,
        computation: ComputedFunctionType<T>,
    ) {
        this.runtime = runtime;
        this.#computation = computation;
        ownership.own(() => {
            this.#dispose();
            return undefined;
        });
    }

    /**
     * @description Reads the memoized value and reevaluates it once when stale.
     * @returns The last successfully committed or newly derived value.
     */
    get(): T {
        this.#assertOpen();

        if (this.#evaluating) {
            throw new Error("Cannot recursively evaluate a computed value.");
        }

        this.runtime.tracker.track(this);

        if (!this.#initialized || this.#stale) {
            this.#evaluate();
        }

        return this.#value;
    }

    /**
     * @description Marks a clean cache stale and invalidates connected consumers once.
     * @returns Nothing.
     */
    invalidate(): void {
        if (this.#disposed || this.#stale) {
            return;
        }

        this.#stale = true;
        this.runtime.tracker.invalidate(this);
    }

    /**
     * @description Permanently closes both graph roles of this computed value.
     * @returns Nothing.
     */
    #dispose(): void {
        if (this.#disposed) {
            return;
        }

        this.#disposed = true;
        this.runtime.tracker.disconnect(this);
        this.runtime.tracker.disconnectSource(this);
    }

    /**
     * @description Transactionally derives and commits a candidate computed value.
     * @remarks A thrown computation leaves the previous cache and dependency graph intact,
     * preserves stale state, and allows a later read to retry.
     * @returns Nothing.
     */
    #evaluate(): void {
        this.#evaluating = true;

        try {
            const candidate = this.runtime.tracker.collect(this, this.#computation);

            if (!this.#initialized || !Object.is(this.#value, candidate)) {
                this.#value = candidate;
            }

            this.#initialized = true;
            this.#stale = false;
        } finally {
            this.#evaluating = false;
        }
    }

    /**
     * @description Verifies that ownership disposal has not closed the computed value.
     * @returns Nothing.
     */
    #assertOpen(): void {
        if (this.#disposed) {
            throw new Error("Cannot read a disposed computed value.");
        }
    }
}
