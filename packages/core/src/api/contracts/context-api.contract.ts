import type { ContextIdentity } from "../../context/contracts/context-identity.contract.js";

/**
 * @description Stateless public object API for creating portable context identities.
 * @remarks The public `Context` value implements this contract while each created object
 * implements the separate {@link ContextIdentity} instance contract.
 */
export interface ContextApi {
    /**
     * @description Creates a context identity without a default value.
     * @remarks Reading this context outside a matching provider throws.
     * @typeParam T - Value resolved through the context identity.
     * @returns A portable context identity with missing-provider semantics.
     */
    create<T>(): ContextIdentity<T>;

    /**
     * @description Creates a context identity with one immutable default value.
     * @typeParam T - Value resolved through the context identity.
     * @param defaultValue - Value returned when no matching provider exists.
     * @returns A portable context identity with fallback semantics.
     */
    create<T>(defaultValue: T): ContextIdentity<T>;
}
