import type { IReactiveRuntimeContext } from "./reactive-runtime-context.contract.js";

/** @description Internal type-only identity for the reactive source role. */
export declare const REACTIVE_SOURCE_BRAND: unique symbol;

/**
 * @description Internal contract for a value that can be tracked by reactive consumers.
 * @remarks Signals and future computed values implement this source identity.
 */
export interface IReactiveSource {
    /** @description Type-only marker that distinguishes sources from other graph roles. */
    readonly [REACTIVE_SOURCE_BRAND]: true;

    /** @description Runtime context that owns this source and its dependency edges. */
    readonly runtime: IReactiveRuntimeContext;
}
