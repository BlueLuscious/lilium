import type { ComponentDefinition } from "../../component/contracts/component-definition.contract.js";
import type { ComponentInstance } from "../../instance/contracts/component-instance.contract.js";
import type { ComponentCreateOptionsType } from "../types/component-create-options.type.js";

/**
 * @description Public object that creates headless component instances in one reactive runtime.
 * @remarks A component runtime coordinates behavior and ownership only. It does not own the
 * reactive runtime and has no template, renderer, host, or mounting responsibility.
 */
export interface ComponentRuntime {
    /**
     * @description Creates and initializes one component instance under an explicit owner.
     * @remarks Setup executes synchronously exactly once. A handled setup failure aborts
     * creation and returns `undefined`; a propagated failure throws without exposing an instance.
     * @typeParam Inputs - Declarative input value shape of the component.
     * @typeParam Controller - Public object shape returned by component setup.
     * @param definition - Immutable headless component behavior definition.
     * @param options - Complete initial inputs and owning scope.
     * @returns The initialized instance, or `undefined` when its setup failure was handled.
     */
    create<Inputs extends object, Controller extends object>(
        definition: ComponentDefinition<Inputs, Controller>,
        options: ComponentCreateOptionsType<Inputs>,
    ): ComponentInstance<Inputs, Controller> | undefined;
}
