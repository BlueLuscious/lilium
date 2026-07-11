import type { ReactiveRuntime } from "@lilium/core";
import type { ComponentDefinition } from "../../../component/contracts/component-definition.contract.js";
import type { IComponentInstanceLifecycle } from "../../../instance/contracts/internal/component-instance-lifecycle.contract.js";
import type { ComponentCreateOptionsType } from "../../types/component-create-options.type.js";

/**
 * @description Internal engine that performs atomic component instance creation.
 * @remarks The public component runtime delegates creation to this bridge and erases the
 * returned mutable lifecycle surface before exposing a component instance to consumers.
 */
export interface IComponentEngine {
    /**
     * @description Creates, sets up, and connects one internally mutable component instance.
     * @typeParam Inputs - Declarative input value shape of the component.
     * @typeParam Controller - Public object shape returned by component setup.
     * @param runtime - Reactive runtime used for signals, batching, and owned setup resources.
     * @param definition - Immutable headless component behavior definition.
     * @param options - Complete initial inputs and owning scope.
     * @returns The internal initialized lifecycle, or `undefined` after a handled setup failure.
     */
    create<Inputs extends object, Controller extends object>(
        runtime: ReactiveRuntime,
        definition: ComponentDefinition<Inputs, Controller>,
        options: ComponentCreateOptionsType<Inputs>,
    ): IComponentInstanceLifecycle<Inputs, Controller> | undefined;
}
