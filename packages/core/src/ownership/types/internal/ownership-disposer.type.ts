/**
 * @description Internal disposal operation that contributes unhandled failures to one pass.
 * @remarks Parent and child owners share the same error collection so recursive disposal
 * routes each failure through ownership boundaries exactly once.
 * @param errors - Mutable internal collection of unhandled disposal failures.
 * @returns `undefined` after the owned entry has completed its disposal attempt.
 */
export type TOwnershipDisposer = (errors: unknown[]) => undefined;
