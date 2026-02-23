/**
 * @description Type-only phantom symbol used to preserve `ContextKey<T>` variance.
 * @remarks This symbol is never read at runtime.
 */
declare const CONTEXT_VALUE_TYPE: unique symbol;

/**
 * @description Unique typed context identifier.
 * @remarks Context keys are identity-based (`symbol`) and not string-addressable.
 * @typeParam T - Value type associated with this key.
 */
export interface ContextKey<T> {
    /** @description Runtime identity for the context slot. */
    readonly id: symbol;

    /**
     * @description Type-only phantom field that preserves key/value typing.
     * @remarks This member does not exist at runtime.
     */
    readonly [CONTEXT_VALUE_TYPE]?: T;
}
