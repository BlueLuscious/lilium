import type { ComputedFunctionType } from "../types/computed-function.type.js";
import type { EffectFunctionType } from "../types/effect-function.type.js";
import type { SignalOptionsType } from "../types/signal-options.type.js";
import type { Computed } from "./computed.contract.js";
import type { Effect } from "./effect.contract.js";
import type { Signal } from "./signal.contract.js";

/**
 * @description Public object contract for creating and coordinating reactive resources.
 * @remarks Resources are added only after their execution semantics and ownership
 * rules are approved; concrete runtime implementation remains internal.
 */
export interface ReactiveRuntime {
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
