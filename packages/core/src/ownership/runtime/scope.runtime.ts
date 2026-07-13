import type { ContextIdentity } from "../../context/contracts/context-identity/context-identity.contract.js";
import type { IContextScope } from "../../context/contracts/internal/context-scope.contract.js";
import { CONTEXT_SCOPE_BRAND } from "../../context/contracts/internal/context-scope.contract.js";
import type { TContextResolution } from "../../context/types/internal/context-resolution.type.js";
import type { ErrorBoundary } from "../contracts/error-boundary/error-boundary.contract.js";
import type { Scope } from "../contracts/scope/scope.contract.js";
import type { ErrorBoundaryFunctionType } from "../types/error-boundary/error-boundary-function.type.js";
import type { TOwnershipDisposer } from "../types/internal/ownership-disposer.type.js";
import type { ScopeCleanupType } from "../types/scope/scope-cleanup.type.js";
import type { ScopeFunctionType } from "../types/scope/scope-function.type.js";
import type { OwnershipManager } from "./ownership.manager.js";

/**
 * @description Internal mutable implementation of public scope and context-scope contracts.
 * @remarks Each instance owns one registration-ordered ledger and permanently closes after
 * disposal. Provider topology becomes immutable when its first execution begins.
 */
export class ScopeRuntime implements IContextScope {
    /** @description Type-only identity required by the internal context-scope bridge. */
    declare readonly [CONTEXT_SCOPE_BRAND]: true;

    /** @description Owned disposal operations in their original registration order. */
    readonly #ledger: TOwnershipDisposer[] = [];

    /** @description Context provider values stored by portable context identity. */
    readonly #providers = new Map<ContextIdentity<unknown>, unknown>();

    /** @description Number of synchronous executions currently active on this scope. */
    #activeDepth = 0;

    /** @description Whether this scope has permanently completed disposal. */
    #disposed = false;

    /** @description Whether this scope is currently processing its ownership ledger. */
    #disposing = false;

    /** @description Whether this scope has begun its first execution. */
    #started = false;

    /**
     * @description Creates one internal scope attached to an ownership manager.
     * @param manager - Ownership manager that validates and coordinates this scope.
     * @param parent - Explicit parent scope, or `null` for a runtime-owned root scope.
     * @param errorHandler - Immutable boundary handler, or `null` for a regular scope.
     */
    constructor(
        /** @description Ownership manager that owns this scope implementation. */
        readonly manager: OwnershipManager,
        /** @description Explicit parent scope used for context and error traversal. */
        readonly parent: ScopeRuntime | null,
        /** @description Error handler attached to this scope when it is a boundary. */
        readonly errorHandler: ErrorBoundaryFunctionType | null = null,
    ) {}

    /**
     * @description Creates a child error boundary owned by this scope.
     * @param handler - Immutable synchronous handler for failures in the boundary subtree.
     * @returns A child error boundary registered in this scope's ownership ledger.
     */
    boundary(handler: ErrorBoundaryFunctionType): ErrorBoundary {
        this.#assertMutable("create an error boundary");
        return this.manager.createBoundary(this, handler);
    }

    /**
     * @description Creates a regular child scope owned by this scope.
     * @returns A child scope registered in this scope's ownership ledger.
     */
    child(): Scope {
        this.#assertMutable("create a child scope");
        return this.manager.createChild(this);
    }

    /**
     * @description Registers one synchronous cleanup in this scope's ownership ledger.
     * @param cleanup - Cleanup operation to execute during scope disposal.
     * @returns Nothing.
     */
    cleanup(cleanup: ScopeCleanupType): void {
        this.#assertMutable("register a cleanup");
        this.registerDisposer((errors) => {
            try {
                cleanup();
            } catch (error) {
                this.manager.collectError(error, this, errors);
            }

            return undefined;
        });
    }

    /**
     * @description Disposes this scope and every owned entry in last-in-first-out order.
     * @remarks Repeated disposal is safe. Disposal is rejected while this scope or one of
     * its descendants is active.
     * @returns Nothing.
     */
    dispose(): void {
        if (this.#disposed) {
            return;
        }

        if (this.manager.isActive(this)) {
            throw new Error("Cannot dispose an active scope.");
        }

        const errors: unknown[] = [];
        this.disposeInto(errors);
        this.manager.throwCollected(errors);
    }

    /**
     * @description Executes a synchronous operation with this scope as active owner.
     * @param operation - Scoped operation whose created resources belong to this scope.
     * @returns Nothing.
     */
    run(operation: ScopeFunctionType): void {
        this.#assertOpen("run");
        this.manager.execute(this, operation);
    }

    /**
     * @description Registers one context provider before this scope starts execution.
     * @typeParam T - Value associated with the context identity.
     * @param context - Portable context identity used as the provider key.
     * @param value - Value stored by this scope.
     * @returns Nothing.
     */
    provideContext<T>(context: ContextIdentity<T>, value: T): void {
        this.#assertMutable("provide a context value");

        if (this.#started) {
            throw new Error("Context providers must be registered before scope execution.");
        }

        const key = context as ContextIdentity<unknown>;
        if (this.#providers.has(key)) {
            throw new Error("A context value is already registered on this scope.");
        }

        this.#providers.set(key, value);
    }

    /**
     * @description Resolves the nearest context provider from this scope through its parents.
     * @typeParam T - Value associated with the context identity.
     * @param context - Portable context identity being resolved.
     * @returns An explicit found or missing context resolution.
     */
    resolveContext<T>(context: ContextIdentity<T>): TContextResolution<T> {
        this.#assertOpen("resolve a context value");

        let current: ScopeRuntime | null = this;
        const key = context as ContextIdentity<unknown>;

        while (current !== null) {
            if (current.#providers.has(key)) {
                return {
                    found: true,
                    value: current.#providers.get(key) as T,
                };
            }

            current = current.parent;
        }

        return { found: false };
    }

    /**
     * @description Locks provider topology and marks one scope execution as active.
     * @returns Nothing.
     */
    beginExecution(): void {
        this.#assertOpen("run");
        this.#started = true;
        this.#activeDepth += 1;
    }

    /**
     * @description Contributes this scope's complete disposal to one recursive error pass.
     * @remarks This internal operation never throws collected cleanup errors directly, which
     * prevents parent owners from routing child failures through boundaries more than once.
     * @param errors - Shared collection of unhandled recursive disposal failures.
     * @returns Nothing.
     */
    disposeInto(errors: unknown[]): void {
        if (this.#disposed || this.#disposing) {
            return;
        }

        if (this.#activeDepth > 0) {
            this.manager.collectError(new Error("Cannot dispose an active scope."), this, errors);
            return;
        }

        this.#disposing = true;

        try {
            for (let index = this.#ledger.length - 1; index >= 0; index -= 1) {
                this.#ledger[index](errors);
            }
        } finally {
            this.#ledger.length = 0;
            this.#providers.clear();
            this.#disposed = true;
            this.#disposing = false;
        }
    }

    /**
     * @description Marks one synchronous scope execution as complete.
     * @returns Nothing.
     */
    endExecution(): void {
        this.#activeDepth -= 1;
    }

    /**
     * @description Registers an internal owned disposer in this scope's ledger.
     * @param disposer - Internal operation participating in recursive error collection.
     * @returns Nothing.
     */
    registerDisposer(disposer: TOwnershipDisposer): void {
        this.#assertMutable("register an owned resource");
        this.#ledger.push(disposer);
    }

    /**
     * @description Verifies that this scope can accept an ownership mutation.
     * @param operation - Human-readable operation used when reporting invalid state.
     * @returns Nothing.
     */
    #assertMutable(operation: string): void {
        this.#assertOpen(operation);

        if (this.manager.recovering) {
            throw new Error(`Cannot ${operation} during error recovery.`);
        }
    }

    /**
     * @description Verifies that this scope has not entered or completed disposal.
     * @param operation - Human-readable operation used when reporting invalid state.
     * @returns Nothing.
     */
    #assertOpen(operation: string): void {
        if (this.#disposed || this.#disposing) {
            throw new Error(`Cannot ${operation} on a disposed scope.`);
        }
    }
}
