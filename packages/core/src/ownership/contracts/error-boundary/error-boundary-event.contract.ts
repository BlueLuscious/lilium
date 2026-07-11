import type { Scope } from "../scope/scope.contract.js";

/**
 * @description Immutable event delivered to an ownership error boundary.
 * @remarks The event intentionally carries an unknown error so boundaries can handle
 * framework, platform, renderer, and user-defined failures without a closed hierarchy.
 */
export interface ErrorBoundaryEvent {
    /** @description Original error reported by the failing owned operation. */
    readonly error: unknown;

    /**
     * @description Nearest scope that owned the failing operation.
     * @remarks The value is null when the failure belongs directly to a runtime root.
     */
    readonly owner: Scope | null;
}
