import type { ContextApi } from "./contracts/context-api.contract.js";
import type { Context as ContextContract } from "../context/contracts/context/context.contract.js";
import { ContextRuntime } from "../context/runtime/context.runtime.js";

/**
 * @description Public context instance type merged with the `Context` factory value.
 * @remarks This facade adds no behavior to the canonical context feature contract.
 * @typeParam T - Value resolved through the context identity.
 */
export interface Context<T> extends ContextContract<T> {}

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
    create<T>(defaultValue?: T): ContextContract<T> {
        return arguments.length === 0
            ? ContextRuntime.required<T>()
            : ContextRuntime.withDefault(defaultValue as T);
    },
});
