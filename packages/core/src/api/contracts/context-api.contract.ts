import type { Context } from "../../context/contracts/context/context.contract.js";

/**
 * @description Stateless public object API for creating portable context identities.
 * @remarks The public `Context` value implements this contract in the value namespace
 * while the existing `Context<T>` interface remains its type-level instance contract.
 */
export interface ContextApi {
    /**
     * @description Creates a context identity without a default value.
     * @remarks Reading this context outside a matching provider throws.
     * @typeParam T - Value resolved through the context identity.
     * @returns A portable context identity with missing-provider semantics.
     */
    create<T>(): Context<T>;

    /**
     * @description Creates a context identity with one immutable default value.
     * @typeParam T - Value resolved through the context identity.
     * @param defaultValue - Value returned when no matching provider exists.
     * @returns A portable context identity with fallback semantics.
     */
    create<T>(defaultValue: T): Context<T>;
}
