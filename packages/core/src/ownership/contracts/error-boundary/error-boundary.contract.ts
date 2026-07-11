import type { Scope } from "../scope/scope.contract.js";

/** @description Internal type-only identity for the public error boundary handle. */
export declare const ERROR_BOUNDARY_BRAND: unique symbol;

/**
 * @description Specialized ownership scope that handles failures from its owned subtree.
 * @remarks The boundary handler is immutable and participates in nearest-owner propagation.
 */
export interface ErrorBoundary extends Scope {
    /** @description Type-only marker that distinguishes boundaries from plain scopes. */
    readonly [ERROR_BOUNDARY_BRAND]: true;
}
