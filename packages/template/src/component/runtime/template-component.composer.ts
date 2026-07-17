import type { ComponentDefinition } from "@lilium/component";
import type { TemplateDefinition } from "../../definition/contracts/template-definition.contract.js";
import type { TemplateDefinitionRegistry } from "../../definition/runtime/template-definition.registry.js";
import type { TemplatedComponentDefinition } from "../contracts/templated-component-definition.contract.js";
import type { ComponentTemplateStateType } from "../types/component-template-state.type.js";

/**
 * @description Internal creator and nominal validator for component-template compositions.
 * @remarks Composition retains exact independent definition identities and creates no component
 * runtime, occurrence, ownership scope, reactive resource, or Renderer state.
 */
export class TemplateComponentComposer {
    /** @description Registry validating normalized Template definitions. */
    readonly #definitions: TemplateDefinitionRegistry;

    /** @description Genuine component-template composition identities created here. */
    readonly #compositions = new WeakSet<object>();

    /**
     * @description Constructs one composer over the package definition registry.
     * @param definitions - Registry validating genuine normalized Template definitions.
     */
    constructor(definitions: TemplateDefinitionRegistry) {
        this.#definitions = definitions;
    }

    /**
     * @description Creates one immutable composition of independent compatible definitions.
     * @typeParam Inputs - Declarative component input value shape.
     * @typeParam Controller - Public controller object returned by component setup.
     * @param component - Frozen public headless component definition.
     * @param template - Genuine compatible normalized Template definition.
     * @returns A new nominal component-template composition identity.
     */
    compose<Inputs extends object, Controller extends object>(
        component: ComponentDefinition<Inputs, Controller>,
        template: TemplateDefinition<ComponentTemplateStateType<Inputs, Controller>>,
    ): TemplatedComponentDefinition<Inputs, Controller> {
        this.#assertComponentDefinition(component);
        this.#definitions.assertDefinition(template);
        const slots = this.#definitions.getSlots(template);
        const composition = Object.freeze({
            component,
            template,
            slots,
        }) as TemplatedComponentDefinition<Inputs, Controller>;
        this.#compositions.add(composition);
        return composition;
    }

    /**
     * @description Verifies that a candidate is a genuine component-template composition.
     * @param composition - Candidate supplied to a nested component declaration.
     * @returns Nothing.
     */
    assertComposition(
        composition: unknown,
    ): asserts composition is TemplatedComponentDefinition<object, object> {
        if (
            typeof composition !== "object" ||
            composition === null ||
            !this.#compositions.has(composition)
        ) {
            throw new TypeError(
                "A templated component must be a genuine Template composition identity.",
            );
        }
    }

    /**
     * @description Verifies one candidate is an immutable public Component definition.
     * @param component - Candidate supplied to `Template.compose()`.
     * @returns Nothing.
     */
    #assertComponentDefinition(
        component: unknown,
    ): asserts component is ComponentDefinition<object, object> {
        if (
            typeof component !== "object" ||
            component === null ||
            Array.isArray(component) ||
            !Object.isFrozen(component) ||
            typeof Reflect.get(component, "setup") !== "function"
        ) {
            throw new TypeError(
                "A templated component requires an immutable public Component definition.",
            );
        }
    }
}
