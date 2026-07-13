import type { ContextIdentity } from "../context/contracts/context-identity.contract.js";
import { ContextIdentityRuntime } from "../context/runtime/context-identity.runtime.js";
import type { ContextApi } from "./contracts/context-api.contract.js";

/**
 * @description Immutable public factory for portable context identities.
 * @remarks Calling `create()` with an explicit `undefined` creates a defaulted context;
 * only an omitted argument creates a required context.
 */
export const Context: ContextApi = Object.freeze({
    /**
     * @description Creates a required or defaulted portable context identity.
     * @typeParam T - Value associated with the context identity.
     * @param defaultValue - Optional explicit immutable fallback value.
     * @returns A frozen context identity independent from any reactive runtime.
     */
    create<T>(...defaultValue: [] | [T]): ContextIdentity<T> {
        return defaultValue.length === 0
            ? ContextIdentityRuntime.required<T>()
            : ContextIdentityRuntime.withDefault(defaultValue[0]);
    },
});
