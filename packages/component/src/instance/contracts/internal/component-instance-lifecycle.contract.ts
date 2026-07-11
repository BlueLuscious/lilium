import type { ComponentInstance } from "../component-instance.contract.js";
import type { ComponentInputValuesType } from "../../../inputs/types/component-input-values.type.js";

/**
 * @description Internal mutable lifecycle surface of one initialized component instance.
 * @remarks The component engine retains this surface while consumers receive only its
 * public `ComponentInstance` contract. Setup has already completed before this object exists.
 * @typeParam Inputs - Declarative input value shape of the component.
 * @typeParam Controller - Public object shape returned by component setup.
 */
export interface IComponentInstanceLifecycle<
    Inputs extends object,
    Controller extends object,
> extends ComponentInstance<Inputs, Controller> {
    /**
     * @description Replaces every component input from one normalized value snapshot.
     * @remarks The future runtime must write all input signals in one reactive batch.
     * Calling this operation after disposal is an invalid lifecycle transition.
     * @param values - Complete next input values, including optional keys as `undefined`.
     * @returns Nothing.
     */
    updateInputs(values: ComponentInputValuesType<Inputs>): void;
}
