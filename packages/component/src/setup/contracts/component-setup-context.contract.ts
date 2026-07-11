import type {
    ReactiveRuntime,
    Scope,
} from "@lilium/core";

/**
 * @description Public object available during one headless component setup execution.
 * @remarks The scope is active while setup runs, so created reactive resources and
 * child scopes are owned by the component instance.
 */
export interface ComponentSetupContext {
    /** @description Reactive runtime that owns the component instance. */
    readonly runtime: ReactiveRuntime;

    /** @description Ownership scope dedicated to the component instance. */
    readonly scope: Scope;
}
