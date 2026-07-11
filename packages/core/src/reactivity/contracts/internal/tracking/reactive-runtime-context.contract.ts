import type { IReactiveTracker } from "./reactive-tracker.contract.js";

/**
 * @description Internal bridge to the tracking service owned by a reactive runtime.
 * @remarks Concrete runtime classes implement this contract without exposing the
 * tracker through the public {@link ReactiveRuntime} API.
 */
export interface IReactiveRuntimeContext {
    /** @description Dependency tracker isolated to this runtime context. */
    readonly tracker: IReactiveTracker;
}
