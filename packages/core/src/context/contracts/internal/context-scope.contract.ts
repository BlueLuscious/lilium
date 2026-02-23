import type { ContextKey } from "../context-key.contract";


/**
 * @description Internal contract for a context scope used during render.
 * @remarks Runtime implementations can provide values and resolve inherited values.
 */
export interface IContextScope {
    /**
     * @description Stores a context value for the provided key in the current scope.
     * @typeParam T - Value type associated with the key.
     * @param key - Typed context key.
     * @param value - Context value to store.
     */
    provide<T>(key: ContextKey<T>, value: T): void;

    /**
     * @description Resolves a context value for the provided key.
     * @typeParam T - Value type associated with the key.
     * @param key - Typed context key.
     * @returns Context value resolved from current or parent scopes.
     */
    consume<T>(key: ContextKey<T>): T;
}
