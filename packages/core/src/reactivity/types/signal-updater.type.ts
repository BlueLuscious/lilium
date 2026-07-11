/**
 * @description Pure function that derives the next signal value from its current value.
 * @typeParam T - Signal value accepted and returned by the updater.
 * @param currentValue - Current value stored by the signal.
 * @returns The next value to store.
 */
export type SignalUpdaterType<T> = (currentValue: T) => T;
