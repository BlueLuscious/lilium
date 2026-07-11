import type { SignalEqualityType } from "./signal-equality.type.js";

/**
 * @description Immutable options used when creating a signal.
 * @remarks When no equality function is provided, the runtime uses `Object.is`.
 * @typeParam T - Type of value stored by the configured signal.
 */
export type SignalOptionsType<T> = Readonly<{
    /** @description Optional equality function applied to signal writes. */
    equals?: SignalEqualityType<T>;
}>;
