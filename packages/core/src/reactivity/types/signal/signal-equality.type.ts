/**
 * @description Compares the current and candidate values of a signal write.
 * @remarks Returning `true` preserves the current value and prevents invalidation.
 * Returning `false` accepts the candidate value and invalidates dependents.
 * @typeParam T - Type of values compared by the function.
 * @param currentValue - Value currently stored by the signal.
 * @param nextValue - Candidate value produced by a write.
 * @returns Whether both values are observably equal.
 */
export type SignalEqualityType<T> = (currentValue: T, nextValue: T) => boolean;
