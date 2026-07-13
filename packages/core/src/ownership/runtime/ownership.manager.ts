import type { Scope } from "../contracts/scope/scope.contract.js";
import type { ErrorBoundaryFunctionType } from "../types/error-boundary/error-boundary-function.type.js";
import type { TOwnershipDisposer } from "../types/internal/ownership-disposer.type.js";
import type { TOwnershipUntrackedExecutor } from "../types/internal/ownership-untracked-executor.type.js";
import type { ScopeCleanupType } from "../types/scope/scope-cleanup.type.js";
import type { ScopeFunctionType } from "../types/scope/scope-function.type.js";
import { ErrorBoundaryRuntime } from "./error-boundary.runtime.js";
import { ownershipContext } from "./ownership-context.manager.js";
import { ScopeRuntime } from "./scope.runtime.js";

/**
 * @description Default recovery executor used before dependency tracking is composed.
 * @param operation - Recovery operation to execute directly.
 * @returns The value returned by the recovery operation.
 */
const executeNormally: TOwnershipUntrackedExecutor = (operation) => operation();

/**
 * @description Internal owner of one runtime root ledger and its explicit scope trees.
 * @remarks The manager isolates scope identity per runtime, routes owned failures through
 * boundaries, and coordinates recursive disposal without exposing mutable collections.
 */
export class OwnershipManager {
    /** @description Runtime-root disposal operations in registration order. */
    readonly #rootLedger: TOwnershipDisposer[] = [];

    /** @description Scope identities created by and valid for this manager. */
    readonly #scopes = new WeakSet<ScopeRuntime>();

    /** @description Adapter used to execute boundary handlers without dependency tracking. */
    readonly #untrack: TOwnershipUntrackedExecutor;

    /** @description Whether this runtime owner has permanently completed disposal. */
    #disposed = false;

    /** @description Whether this runtime owner is currently disposing its root ledger. */
    #disposing = false;

    /**
     * @description Creates an isolated ownership manager.
     * @param untrack - Adapter used to suspend dependency tracking during recovery.
     */
    constructor(untrack: TOwnershipUntrackedExecutor = executeNormally) {
        this.#untrack = untrack;
    }

    /**
     * @description Reports whether the shared ownership context is executing recovery.
     * @returns `true` while at least one error-boundary handler is active.
     */
    get recovering(): boolean {
        return ownershipContext.recovering;
    }

    /**
     * @description Reports whether root disposal has permanently completed.
     * @returns Whether this ownership manager is disposed.
     */
    get disposed(): boolean {
        return this.#disposed;
    }

    /**
     * @description Reports whether root disposal is currently releasing resources.
     * @returns Whether this ownership manager is disposing.
     */
    get disposing(): boolean {
        return this.#disposing;
    }

    /**
     * @description Captures the active scope when it belongs to this ownership manager.
     * @remarks A `null` result represents a resource owned directly by the runtime root.
     * @returns The active owned scope, or `null` when execution is at the runtime root.
     */
    captureOwner(): ScopeRuntime | null {
        this.#assertMutable("capture an owner");
        const active = ownershipContext.active;

        if (active === null) {
            return null;
        }

        if (!(active instanceof ScopeRuntime) || !this.#scopes.has(active)) {
            throw new Error("Cannot capture an owner across reactive runtimes.");
        }

        return active;
    }

    /**
     * @description Creates a validated root or child scope for this runtime manager.
     * @param owner - Optional runtime-owned scope that owns the new child.
     * @returns A new inactive scope registered under the root or supplied owner.
     */
    scope(owner?: Scope): ScopeRuntime {
        this.#assertMutable("create a scope");

        if (owner !== undefined) {
            if (!(owner instanceof ScopeRuntime)) {
                throw new TypeError("The scope owner is not a Lilium scope.");
            }

            this.#assertOwned(owner);
            return owner.child() as ScopeRuntime;
        }

        const scope = this.#registerScope(new ScopeRuntime(this, null));

        this.#rootLedger.push((errors) => {
            scope.disposeInto(errors);
            return undefined;
        });

        return scope;
    }

    /**
     * @description Creates an error boundary beneath an owned parent scope.
     * @param parent - Parent scope that owns the new boundary.
     * @param handler - Immutable handler for failures from the boundary subtree.
     * @returns The registered child error boundary runtime.
     */
    createBoundary(parent: ScopeRuntime, handler: ErrorBoundaryFunctionType): ErrorBoundaryRuntime {
        this.#assertOwned(parent);
        this.#assertMutable("create an error boundary");
        const boundary = this.#registerScope(new ErrorBoundaryRuntime(this, parent, handler));
        this.#registerChild(parent, boundary);
        return boundary;
    }

    /**
     * @description Creates a regular child beneath an owned parent scope.
     * @param parent - Parent scope that owns the new child.
     * @returns The registered child scope runtime.
     */
    createChild(parent: ScopeRuntime): ScopeRuntime {
        this.#assertOwned(parent);
        this.#assertMutable("create a child scope");
        const child = this.#registerScope(new ScopeRuntime(this, parent));
        this.#registerChild(parent, child);
        return child;
    }

    /**
     * @description Routes one owned failure through nearest ancestor error boundaries.
     * @remarks Handled failures are removed. Unhandled or handler-generated failures are
     * appended to the supplied collection for deterministic final reporting.
     * @param error - Original failure raised by an owned operation.
     * @param owner - Scope that owned the failed operation, or `null` for a root resource.
     * @param errors - Collection receiving the final unhandled failure.
     * @returns Nothing.
     */
    collectError(error: unknown, owner: ScopeRuntime | null, errors: unknown[]): void {
        let currentError = error;
        let current = owner;

        while (current !== null) {
            const handler = current.errorHandler;

            if (handler !== null) {
                const boundary = current;

                try {
                    const decision = this.#untrack(() =>
                        ownershipContext.recover(boundary, () =>
                            handler({ error: currentError, owner }),
                        ),
                    );

                    if (decision === "handled") {
                        return;
                    }
                } catch (handlerError) {
                    currentError = new AggregateError(
                        [currentError, handlerError],
                        "An ownership error boundary handler failed.",
                    );
                }
            }

            current = current.parent;
        }

        errors.push(currentError);
    }

    /**
     * @description Disposes every root resource and root scope in reverse registration order.
     * @remarks Disposal is idempotent and permanently closes this ownership manager even when
     * unhandled disposal failures are reported after all entries are attempted.
     * @returns Nothing.
     */
    dispose(): void {
        if (this.#disposed) {
            return;
        }

        const active = ownershipContext.active;
        if (active instanceof ScopeRuntime && this.#scopes.has(active)) {
            throw new Error("Cannot dispose a runtime with an active scope.");
        }

        this.#disposing = true;
        const errors: unknown[] = [];

        try {
            for (let index = this.#rootLedger.length - 1; index >= 0; index -= 1) {
                this.#rootLedger[index](errors);
            }
        } finally {
            this.#rootLedger.length = 0;
            this.#disposed = true;
            this.#disposing = false;
        }

        this.throwCollected(errors);
    }

    /**
     * @description Executes one operation with an owned scope as active owner.
     * @param scope - Scope made active for the operation.
     * @param operation - Synchronous operation to execute.
     * @returns Nothing.
     */
    execute(scope: ScopeRuntime, operation: ScopeFunctionType): void {
        this.#assertOwned(scope);
        this.#assertMutable("run a scope");
        scope.beginExecution();

        try {
            try {
                ownershipContext.run(scope, operation);
            } catch (error) {
                const errors: unknown[] = [];
                this.collectError(error, scope, errors);
                this.throwCollected(errors);
            }
        } finally {
            scope.endExecution();
        }
    }

    /**
     * @description Executes scheduled work under its previously captured semantic owner.
     * @remarks Scope-owned work restores active ownership and error boundaries. Root-owned
     * work routes failures through the root error path without creating a synthetic scope.
     * @param owner - Scope captured when the scheduled resource was first enqueued.
     * @param operation - Synchronous scheduled operation to execute.
     * @returns Nothing.
     */
    executeOwned(owner: ScopeRuntime | null, operation: ScopeFunctionType): void {
        if (owner !== null) {
            this.execute(owner, operation);
            return;
        }

        this.#assertMutable("execute root-owned work");

        try {
            operation();
        } catch (error) {
            const errors: unknown[] = [];
            this.collectError(error, null, errors);
            this.throwCollected(errors);
        }
    }

    /**
     * @description Determines whether a scope or one of its descendants is active.
     * @param scope - Owned scope whose active subtree is inspected.
     * @returns Whether the current active-owner chain contains the scope.
     */
    isActive(scope: ScopeRuntime): boolean {
        let active = ownershipContext.active;

        while (active instanceof ScopeRuntime && this.#scopes.has(active)) {
            if (active === scope) {
                return true;
            }

            active = active.parent;
        }

        return false;
    }

    /**
     * @description Registers a resource cleanup under the active scope or runtime root.
     * @param cleanup - Cleanup operation for the owned resource.
     * @returns Nothing.
     */
    own(cleanup: ScopeCleanupType): void {
        this.#assertMutable("register an owned resource");
        const active = ownershipContext.active;

        if (active !== null) {
            if (!(active instanceof ScopeRuntime) || !this.#scopes.has(active)) {
                throw new Error("Cannot register a resource across reactive runtimes.");
            }

            active.cleanup(cleanup);
            return;
        }

        this.#rootLedger.push((errors) => {
            try {
                cleanup();
            } catch (error) {
                this.collectError(error, null, errors);
            }

            return undefined;
        });
    }

    /**
     * @description Reports collected ownership failures after a complete operation.
     * @param errors - Unhandled failures collected in deterministic execution order.
     * @returns Nothing when no failure remains; otherwise this operation throws.
     */
    throwCollected(errors: unknown[]): void {
        if (errors.length === 1) {
            throw errors[0];
        }

        if (errors.length > 1) {
            throw new AggregateError(errors, "Multiple ownership operations failed.");
        }
    }

    /**
     * @description Verifies that this manager can accept an ownership mutation.
     * @param operation - Human-readable operation used when reporting invalid state.
     * @returns Nothing.
     */
    #assertMutable(operation: string): void {
        if (this.#disposed || this.#disposing) {
            throw new Error(`Cannot ${operation} on a disposed runtime owner.`);
        }

        if (ownershipContext.recovering) {
            throw new Error(`Cannot ${operation} during error recovery.`);
        }
    }

    /**
     * @description Verifies that a scope identity belongs to this ownership manager.
     * @param scope - Scope runtime being validated.
     * @returns Nothing.
     */
    #assertOwned(scope: ScopeRuntime): void {
        if (!this.#scopes.has(scope)) {
            throw new Error("The scope does not belong to this runtime owner.");
        }
    }

    /**
     * @description Registers child disposal in its parent's ownership ledger.
     * @param parent - Parent scope receiving the child disposer.
     * @param child - Child scope disposed by that ledger entry.
     * @returns Nothing.
     */
    #registerChild(parent: ScopeRuntime, child: ScopeRuntime): void {
        parent.registerDisposer((errors) => {
            child.disposeInto(errors);
            return undefined;
        });
    }

    /**
     * @description Records one newly created scope as valid for this manager and Context.
     * @typeParam T - Concrete scope runtime subtype being registered.
     * @param scope - Scope runtime to register.
     * @returns The same registered scope instance.
     */
    #registerScope<T extends ScopeRuntime>(scope: T): T {
        this.#scopes.add(scope);
        ownershipContext.register(scope);
        return scope;
    }
}
