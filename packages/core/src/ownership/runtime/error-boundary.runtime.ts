// biome-ignore lint/correctness/noUnusedImports: The unique symbol brands a declare-only property.
import type { ERROR_BOUNDARY_BRAND } from "../contracts/error-boundary/error-boundary.contract.js";
import type { ErrorBoundaryFunctionType } from "../types/error-boundary/error-boundary-function.type.js";
import type { OwnershipManager } from "./ownership.manager.js";
import { ScopeRuntime } from "./scope.runtime.js";

/**
 * @description Internal scope specialization carrying one immutable error-boundary handler.
 * @remarks The nominal brand preserves the public `ErrorBoundary` identity while all ledger,
 * provider, execution, and disposal behavior remains inherited from `ScopeRuntime`.
 */
export class ErrorBoundaryRuntime extends ScopeRuntime {
    /** @description Type-only identity required by the public error-boundary contract. */
    declare readonly [ERROR_BOUNDARY_BRAND]: true;

    /**
     * @description Creates an owned error-boundary runtime.
     * @param manager - Ownership manager coordinating this boundary.
     * @param parent - Parent scope that owns this boundary.
     * @param handler - Immutable synchronous failure handler.
     */
    // biome-ignore lint/complexity/noUselessConstructor: The required handler preserves the boundary invariant.
    constructor(
        manager: OwnershipManager,
        parent: ScopeRuntime,
        handler: ErrorBoundaryFunctionType,
    ) {
        super(manager, parent, handler);
    }
}
