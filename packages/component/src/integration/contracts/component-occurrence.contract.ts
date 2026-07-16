import type { Scope } from "@lilium/core";
import type { ComponentInputValuesType } from "../../inputs/types/component-input-values.type.js";
import type { ComponentInstance } from "../../instance/contracts/component-instance.contract.js";

/**
 * @description Renderer-owned adapter occurrence for one initialized headless component.
 * @remarks This capability retains complete input updates and attachment ownership while exposing
 * only the regular read-only component instance to application and component code.
 * @typeParam Inputs - Declarative input value shape of the component.
 * @typeParam Controller - Public object shape returned by component setup.
 */
export interface ComponentOccurrence<Inputs extends object, Controller extends object> {
    /** @description Dedicated child scope that owns presentation and host attachment resources. */
    readonly attachment: Scope;

    /** @description Stable read-only public view of the initialized headless component. */
    readonly instance: ComponentInstance<Inputs, Controller>;

    /**
     * @description Disposes attachment resources and the complete component occurrence.
     * @remarks Disposal is idempotent and permanently rejects later input updates.
     * @returns Nothing.
     */
    dispose(): void;

    /**
     * @description Replaces every component input from one complete normalized snapshot.
     * @remarks All input writes occur in one Core batch. Optional keys use explicit `undefined`
     * values rather than omission to represent removal.
     * @param values - Complete next input values for this component occurrence.
     * @returns Nothing.
     */
    updateInputs(values: ComponentInputValuesType<Inputs>): void;
}
