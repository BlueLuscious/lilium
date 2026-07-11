/**
 * @description Internal operation executed by the reactive tracking context.
 * @typeParam T - Value returned by the operation.
 * @returns The value produced by the operation.
 */
export type TReactiveComputation<T> = () => T;
