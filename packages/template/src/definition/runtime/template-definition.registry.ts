import type { TemplateSlot } from "../../slot/contracts/template-slot.contract.js";
import type { TemplateDefinition } from "../contracts/template-definition.contract.js";

/**
 * @description Internal nominal registry shared by definition normalization and composition.
 * @remarks Weak identity lets later declaration features verify genuine definitions without
 * exposing a public brand or retaining definitions after application code releases them.
 */
export class TemplateDefinitionRegistry {
    /** @description Genuine normalized template definitions created by this package instance. */
    readonly #definitions = new WeakSet<object>();

    /** @description Immutable accepted-slot maps associated with genuine definitions. */
    readonly #slots = new WeakMap<object, Readonly<Record<string, TemplateSlot<object>>>>();

    /**
     * @description Registers one newly normalized template definition identity.
     * @typeParam State - Read-only object supplied to each Renderer occurrence.
     * @param definition - Frozen normalized definition created by the package normalizer.
     * @param slots - Frozen accepted-slot map collected during normalization.
     * @returns Nothing.
     */
    register<State extends object>(
        definition: TemplateDefinition<State>,
        slots: Readonly<Record<string, TemplateSlot<object>>>,
    ): void {
        this.#definitions.add(definition);
        this.#slots.set(definition, slots);
    }

    /**
     * @description Verifies that a candidate is a genuine normalized template definition.
     * @param definition - Candidate supplied to a composition operation.
     * @returns Nothing.
     */
    assertDefinition(definition: unknown): asserts definition is TemplateDefinition<object> {
        if (
            typeof definition !== "object" ||
            definition === null ||
            !this.#definitions.has(definition)
        ) {
            throw new TypeError("A template definition must be a genuine Template definition.");
        }
    }

    /**
     * @description Returns the immutable slot map collected for one genuine definition.
     * @param definition - Genuine normalized definition supplied to component composition.
     * @returns The exact frozen accepted-slot map associated during normalization.
     */
    getSlots(
        definition: TemplateDefinition<object>,
    ): Readonly<Record<string, TemplateSlot<object>>> {
        this.assertDefinition(definition);
        const slots = this.#slots.get(definition);

        if (slots === undefined) {
            throw new TypeError("A template definition is missing its accepted-slot metadata.");
        }

        return slots;
    }
}
