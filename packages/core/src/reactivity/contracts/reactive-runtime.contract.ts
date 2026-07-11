import type { BatchFunctionType } from "../types/batching/batch-function.type.js";
import type { ComputedFunctionType } from "../types/computed/computed-function.type.js";
import type { EffectFunctionType } from "../types/effect/effect-function.type.js";
import type { SignalOptionsType } from "../types/signal/signal-options.type.js";
import type { Computed } from "./computed/computed.contract.js";
import type { Effect } from "./effect/effect.contract.js";
import type { Signal } from "./signal/signal.contract.js";

/**
 * @description Public object contract for creating and coordinating reactive resources.
 * @remarks Resources are added only after their execution semantics and ownership
 * rules are approved; concrete runtime implementation remains internal.
 */
export interface ReactiveRuntime {
    /**
     * @description Groups synchronous reactive writes into one scheduling boundary.
     * @remarks Writes remain immediately readable and are not rolled back when the
     * operation throws. Nested batches flush only after the outermost boundary exits.
     * @param operation - Synchronous operation containing the grouped writes.
     * @returns Nothing.
     */
    batch(operation: BatchFunctionType): void;

    /**
     * @description Creates a lazy memoized value derived from reactive sources.
     * @typeParam T - Type of value produced by the computation.
     * @param computation - Pure operation that derives the computed value.
     * @returns A read-only computed object connected to this runtime.
     */
    computed<T>(computation: ComputedFunctionType<T>): Computed<T>;

    /**
     * @description Creates a tracked synchronous side effect scheduled in the effect phase.
     * @param effect - Synchronous operation executed with an execution-scoped cleanup object.
     * @returns A disposable effect object connected to this runtime.
     */
    effect(effect: EffectFunctionType): Effect;

    /**
     * @description Creates a mutable signal owned by this reactive runtime.
     * @typeParam T - Type of value stored by the signal.
     * @param initialValue - Value initially stored by the signal.
     * @param options - Optional equality behavior for signal writes.
     * @returns A mutable signal connected to this runtime.
     */
    signal<T>(initialValue: T, options?: SignalOptionsType<T>): Signal<T>;
}
