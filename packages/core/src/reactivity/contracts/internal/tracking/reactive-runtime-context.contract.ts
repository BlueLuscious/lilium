import type { IScheduler } from "../../../../scheduler/contracts/internal/scheduler/scheduler.contract.js";
import type { IReactiveTracker } from "./reactive-tracker.contract.js";

/**
 * @description Internal bridge to the tracking service owned by a reactive runtime.
 * @remarks Concrete runtime classes implement this contract without exposing the
 * tracker through the public {@link ReactiveRuntime} API.
 */
export interface IReactiveRuntimeContext {
    /** @description Deterministic scheduler isolated to this reactive runtime context. */
    readonly scheduler: IScheduler;

    /** @description Dependency tracker isolated to this runtime context. */
    readonly tracker: IReactiveTracker;

    /**
     * @description Flushes eligible scheduled work unless a batching boundary defers it.
     * @returns Nothing.
     */
    requestFlush(): void;
}
