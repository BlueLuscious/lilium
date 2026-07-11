import type { Scope } from "../../../ownership/contracts/scope/scope.contract.js";
import type { TContextResolution } from "../../types/internal/context-resolution.type.js";
import type { Context } from "../context/context.contract.js";

/** @description Internal type-only identity for scopes that store context providers. */
export declare const CONTEXT_SCOPE_BRAND: unique symbol;

/**
 * @description Internal bridge between portable context identities and scope storage.
 * @remarks Concrete scope implementations provide this capability without exposing
 * provider registries or parent traversal through the public `Scope` contract.
 */
export interface IContextScope extends Scope {
    /** @description Type-only marker that distinguishes compatible runtime scopes. */
    readonly [CONTEXT_SCOPE_BRAND]: true;

    /**
     * @description Registers one context provider before the scope starts execution.
     * @typeParam T - Value associated with the context identity.
     * @param context - Portable context identity used as the provider key.
     * @param value - Value stored by this scope.
     * @returns Nothing.
     */
    provideContext<T>(context: Context<T>, value: T): void;

    /**
     * @description Resolves the nearest provider from this scope through its ancestors.
     * @typeParam T - Value associated with the context identity.
     * @param context - Portable context identity being resolved.
     * @returns A result that distinguishes a found `undefined` value from no provider.
     */
    resolveContext<T>(context: Context<T>): TContextResolution<T>;
}
