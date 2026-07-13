import type { ComponentControllerType } from "../../controller/types/component-controller.type.js";
import type { ComponentInputsType } from "../../inputs/types/component-inputs.type.js";
import type { ComponentSetupContext } from "../contracts/component-setup-context.contract.js";

/**
 * @description Synchronous operation that initializes one headless component instance.
 * @remarks Setup executes exactly once in the component scope and returns its public
 * controller object. Templates and renderer behavior are outside this contract.
 * @typeParam Inputs - Declarative input value shape of the component.
 * @typeParam Controller - Object shape exposed by the initialized component.
 * @param context - Runtime and active component ownership scope.
 * @param inputs - Read-only reactive component inputs.
 * @returns The read-only public component controller.
 */
export type ComponentSetupFunctionType<Inputs extends object, Controller extends object> = (
    context: ComponentSetupContext,
    inputs: ComponentInputsType<Inputs>,
) => ComponentControllerType<Controller>;
