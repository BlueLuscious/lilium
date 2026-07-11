import type { Scope } from "@lilium/core";
import type { ComponentInputValuesType } from "../../inputs/types/component-input-values.type.js";

/**
 * @description Immutable values and ownership boundary required to create a component.
 * @remarks The owner must belong to the same reactive runtime used by the component runtime.
 * @typeParam Inputs - Declarative input value shape of the component.
 */
export type ComponentCreateOptionsType<Inputs extends object> = {
    /** @description Complete initial component input value snapshot. */
    readonly inputs: ComponentInputValuesType<Inputs>;

    /** @description Scope that owns the new component instance scope. */
    readonly owner: Scope;
};
