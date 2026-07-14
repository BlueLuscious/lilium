import type { ReactiveRuntime } from "@lilium/core";
import type { ComponentDefinition } from "../../component/contracts/component-definition.contract.js";
import type { ComponentRuntime } from "../../runtime/contracts/component-runtime.contract.js";

/**
 * @description Stateless public object API for defining and executing headless components.
 * @remarks The exported `Component` value implements this contract. Definitions remain
 * independent of a runtime, while each component runtime is bound to one reactive runtime.
 */
export interface ComponentApi {
    /**
     * @description Creates an immutable reusable headless component definition.
     * @remarks This operation performs no setup and captures no reactive runtime.
     * @typeParam Inputs - Declarative input value shape accepted by the component.
     * @typeParam Controller - Public object shape returned by component setup.
     * @param definition - Headless setup behavior to preserve as a definition.
     * @returns An immutable definition that can be reused by multiple component runtimes.
     */
    define<Inputs extends object, Controller extends object>(
        definition: ComponentDefinition<Inputs, Controller>,
    ): ComponentDefinition<Inputs, Controller>;

    /**
     * @description Creates a component runtime associated with one reactive runtime.
     * @remarks The returned object uses but does not own or dispose the reactive runtime.
     * Creating a component runtime does not create a component instance or ownership scope.
     * @param runtime - Reactive runtime used by subsequently created component instances.
     * @returns A component runtime bound to the supplied reactive runtime.
     */
    createRuntime(runtime: ReactiveRuntime): ComponentRuntime;
}
