import type { ComponentDefinition } from "@lilium/component";
import type { ComponentTemplateStateType } from "./component-template-state.type.js";

/**
 * @description Derives the visual state associated with one headless Component definition type.
 * @remarks This utility lets JavaScript generators preserve exact Component input and controller
 * relationships through JSDoc without importing or executing Component runtime implementation.
 * @typeParam Definition - Public Component definition type whose generic state is extracted.
 */
export type ComponentTemplateStateFromDefinitionType<Definition> =
    Definition extends ComponentDefinition<infer Inputs, infer Controller>
        ? ComponentTemplateStateType<Inputs, Controller>
        : never;
