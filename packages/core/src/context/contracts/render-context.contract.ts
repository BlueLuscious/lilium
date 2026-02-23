import type { ContextKey } from "./context-key.contract";


/**
 * @description Read-only context accessor available during component render.
 * @remarks This is the only supported public API to consume context values.
 * A `RenderContext` instance is valid only within the active render call.
 */
export interface RenderContext {
    /**
     * @description Reads a context value for the provided key.
     * @typeParam T - Expected value type associated with the key.
     * @param key - Typed context key to resolve.
     * @returns The resolved context value for the nearest provider in scope.
     */
    consume<T>(key: ContextKey<T>): T;
}
