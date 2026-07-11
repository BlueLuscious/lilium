import type { IReactiveRuntimeContext } from "./reactive-runtime-context.contract.js";

/** @description Internal type-only identity for the reactive consumer role. */
export declare const REACTIVE_CONSUMER_BRAND: unique symbol;

/**
 * @description Internal contract for a computation that consumes reactive sources.
 * @remarks Consumers belong to exactly one runtime and are invalidated by its tracker.
 */
export interface IReactiveConsumer {
    /** @description Type-only marker that distinguishes consumers from other graph roles. */
    readonly [REACTIVE_CONSUMER_BRAND]: true;

    /** @description Runtime context that owns this consumer and its dependencies. */
    readonly runtime: IReactiveRuntimeContext;

    /**
     * @description Marks this consumer as requiring reevaluation.
     * @remarks Invalidation does not require immediate execution; scheduling policy
     * is defined separately by the consumer category and scheduler.
     * @returns Nothing.
     */
    invalidate(): void;
}
