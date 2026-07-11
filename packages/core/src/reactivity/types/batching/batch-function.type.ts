/**
 * @description Synchronous operation that groups reactive writes into one scheduling boundary.
 * @returns `undefined` after all grouped writes complete.
 */
export type BatchFunctionType = () => undefined;
