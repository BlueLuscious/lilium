/**
 * @description Read-only reactive value observed through tracked reads.
 * @remarks Reading the value during a reactive computation registers that
 * computation as a dependency of the signal.
 * @typeParam T - Value exposed by the signal.
 */
export interface ReadonlySignal<T> {
    /**
     * @description Reads the current signal value and tracks the active reactive consumer.
     * @returns The current signal value.
     */
    get(): T;
}
