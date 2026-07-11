import type { SignalUpdaterType } from "../types/signal-updater.type.js";
import type { ReadonlySignal } from "./readonly-signal.contract.js";

/**
 * @description Mutable reactive value with explicit read and write operations.
 * @remarks Signals are created and owned by a reactive runtime. Their concrete
 * runtime implementation is not part of the public contract.
 * @typeParam T - Value stored by the signal.
 */
export interface Signal<T> extends ReadonlySignal<T> {
    /**
     * @description Replaces the current signal value.
     * @param value - Next value to store.
     * @returns Nothing.
     */
    set(value: T): void;

    /**
     * @description Replaces the current value using its latest value.
     * @param updater - Function that receives the current value and returns the next value.
     * @returns Nothing.
     */
    update(updater: SignalUpdaterType<T>): void;
}
