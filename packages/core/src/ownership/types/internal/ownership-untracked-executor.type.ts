/**
 * @description Internal adapter that executes ownership recovery without reactive tracking.
 * @typeParam T - Value returned by the recovery operation.
 * @param operation - Recovery operation executed outside dependency collection.
 * @returns The value returned by the recovery operation.
 */
export type TOwnershipUntrackedExecutor = <T>(operation: () => T) => T;
