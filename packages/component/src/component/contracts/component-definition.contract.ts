import type { ComponentSetupFunctionType } from "../../setup/types/component-setup-function.type.js";

/**
 * @description Immutable reusable definition of a headless Lilium component.
 * @remarks A definition contains behavior setup only. Templates, renderer operations,
 * visual slots, and host lifecycle are composed by higher-level packages.
 * @typeParam Inputs - Declarative input value shape accepted by the component.
 * @typeParam Controller - Public object shape exposed by each component instance.
 */
export interface ComponentDefinition<Inputs extends object, Controller extends object> {
    /** @description Synchronous setup operation executed once per component instance. */
    readonly setup: ComponentSetupFunctionType<Inputs, Controller>;
}
