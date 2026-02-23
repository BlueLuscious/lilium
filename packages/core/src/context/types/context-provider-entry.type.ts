import type { ContextKey } from "../contracts/context-key.contract";


/**
 * @description Single context provider entry.
 * @remarks Represented as an immutable tuple of `[key, value]`.
 * @typeParam T - Value type provided for the key.
 */
export type ContextProviderEntryType<T = unknown> = readonly [
    key: ContextKey<T>,
    value: T
];
