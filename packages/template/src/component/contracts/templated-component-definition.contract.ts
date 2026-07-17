import type { ComponentDefinition } from "@lilium/component";
import type { TemplateDefinition } from "../../definition/contracts/template-definition.contract.js";
import type { TemplateSlot } from "../../slot/contracts/template-slot.contract.js";
import type { ComponentTemplateStateType } from "../types/component-template-state.type.js";

/**
 * @description Immutable composition of independent compatible component and template identities.
 * @remarks Composition mutates neither definition and allocates no runtime occurrence. The same
 * headless component or visual template may participate in multiple compositions.
 * @typeParam Inputs - Declarative component input value shape.
 * @typeParam Controller - Public controller object returned by component setup.
 */
export interface TemplatedComponentDefinition<Inputs extends object, Controller extends object> {
    /** @description Reusable headless behavior definition. */
    readonly component: ComponentDefinition<Inputs, Controller>;

    /** @description Compatible reusable visual template definition. */
    readonly template: TemplateDefinition<ComponentTemplateStateType<Inputs, Controller>>;

    /** @description Immutable diagnostic-name map of slots accepted by the visual template. */
    readonly slots: Readonly<Record<string, TemplateSlot<object>>>;
}
