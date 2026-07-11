/**
 * @description Pure operation that derives a computed value from reactive sources.
 * @typeParam T - Value produced by the computation.
 * @returns The value derived from the reactive sources read during execution.
 */
export type ComputedFunctionType<T> = () => T;
