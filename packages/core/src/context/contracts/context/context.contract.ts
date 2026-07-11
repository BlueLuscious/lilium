import type { Scope } from "../../../ownership/contracts/scope/scope.contract.js";

/**
 * @description Portable typed identity for values resolved through ownership scopes.
 * @remarks A context definition is runtime-independent and may be reused by component
 * libraries across multiple applications. Provider storage remains local to each scope.
 * @typeParam T - Value associated with this context identity.
 */
export interface Context<T> {
    /**
     * @description Resolves the nearest provided value from the active ownership chain.
     * @remarks Resolution is not reactive; provide a reactive object as the value when
     * consumers must observe changes. Missing resolution throws when the definition
     * has no immutable default.
     * @returns The nearest provided value or the immutable context default.
     */
    get(): T;

    /**
     * @description Registers this context value on an uninitialized scope.
     * @remarks A scope accepts one value per context before its first execution.
     * Duplicate registration or registration after execution begins throws.
     * @param scope - Scope that owns the provider entry.
     * @param value - Typed value resolved by this scope and its descendants.
     * @returns Nothing.
     */
    provide(scope: Scope, value: T): void;
}
