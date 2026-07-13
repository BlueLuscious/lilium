import type { IContextScope } from "../../context/contracts/internal/context-scope.contract.js";
import type { Scope } from "../contracts/scope/scope.contract.js";

/**
 * @description Internal process-wide stack for active ownership and recovery execution.
 * @remarks Context identities are runtime-independent, so active scope lookup must preserve
 * nesting across different reactive runtimes without merging their ownership ledgers.
 */
class OwnershipContextManager {
    /** @description Runtime scopes recognized as valid context provider stores. */
    readonly #scopes = new WeakSet<object>();

    /** @description Scope currently active in the synchronous execution stack. */
    #active: IContextScope | null = null;

    /** @description Number of nested error-boundary recovery operations. */
    #recoveryDepth = 0;

    /**
     * @description Reads the scope currently active for ownership and context lookup.
     * @returns The active internal context scope, or `null` outside scoped execution.
     */
    get active(): IContextScope | null {
        return this.#active;
    }

    /**
     * @description Reports whether ownership error recovery is currently executing.
     * @returns `true` while at least one recovery handler is active.
     */
    get recovering(): boolean {
        return this.#recoveryDepth > 0;
    }

    /**
     * @description Determines whether a public scope is registered as a Core context scope.
     * @param scope - Public scope candidate being validated.
     * @returns Whether the scope implements the registered internal context bridge.
     */
    isScope(scope: Scope): scope is IContextScope {
        return this.#scopes.has(scope);
    }

    /**
     * @description Registers a runtime scope as compatible with context provider storage.
     * @param scope - Internal context scope created by an ownership manager.
     * @returns Nothing.
     */
    register(scope: IContextScope): void {
        this.#scopes.add(scope);
    }

    /**
     * @description Executes an error-boundary handler with its boundary as active owner.
     * @typeParam T - Value returned by the recovery operation.
     * @param scope - Boundary scope visible to context lookup during recovery.
     * @param operation - Recovery operation to execute.
     * @returns The value returned by the recovery operation.
     */
    recover<T>(scope: IContextScope, operation: () => T): T {
        this.#recoveryDepth += 1;

        try {
            return this.run(scope, operation);
        } finally {
            this.#recoveryDepth -= 1;
        }
    }

    /**
     * @description Executes an operation with one scope as the synchronous active owner.
     * @typeParam T - Value returned by the scoped operation.
     * @param scope - Scope to expose as active while the operation executes.
     * @param operation - Synchronous operation to execute.
     * @returns The value returned by the scoped operation.
     */
    run<T>(scope: IContextScope, operation: () => T): T {
        const previous = this.#active;
        this.#active = scope;

        try {
            return operation();
        } finally {
            this.#active = previous;
        }
    }
}

/** @description Shared internal active-owner context used by Core runtime services. */
export const ownershipContext = new OwnershipContextManager();
