import type { SignalOptionsType } from "../types/signal-options.type.js";
import type { Signal } from "./signal.contract.js";

/**
 * @description Public object contract for creating and coordinating reactive resources.
 * @remarks This initial contract only exposes signal creation. Additional resources
 * are added after their execution semantics and ownership rules are approved.
 */
export interface ReactiveRuntime {
    /**
     * @description Creates a mutable signal owned by this reactive runtime.
     * @typeParam T - Type of value stored by the signal.
     * @param initialValue - Value initially stored by the signal.
     * @param options - Optional equality behavior for signal writes.
     * @returns A mutable signal connected to this runtime.
     */
    signal<T>(initialValue: T, options?: SignalOptionsType<T>): Signal<T>;
}
