import type { ScopeCleanupType } from "../../types/scope/scope-cleanup.type.js";
import type { ScopeFunctionType } from "../../types/scope/scope-function.type.js";

/**
 * @description Explicit ownership boundary for resources, child scopes, and cleanups.
 * @remarks A scope may run multiple synchronous operations before disposal. Resources
 * created while it is active are registered in one deterministic ownership stack.
 */
export interface Scope {
    /**
     * @description Creates a child scope owned by this scope.
     * @returns A new inactive child scope.
     */
    child(): Scope;

    /**
     * @description Registers a synchronous cleanup owned by this scope.
     * @param cleanup - Cleanup operation executed during scope disposal.
     * @returns Nothing.
     */
    cleanup(cleanup: ScopeCleanupType): void;

    /**
     * @description Recursively disposes this scope and its ownership stack.
     * @remarks Disposal is idempotent and processes resources in last-in-first-out order.
     * @returns Nothing.
     */
    dispose(): void;

    /**
     * @description Executes a synchronous operation with this scope as active owner.
     * @param operation - Operation whose created resources are owned by this scope.
     * @returns Nothing.
     */
    run(operation: ScopeFunctionType): void;
}
