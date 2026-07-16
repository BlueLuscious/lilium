import type { TemplateDefinition } from "../contracts/template-definition.contract.js";

/**
 * @description Internal nominal registry shared by definition normalization and composition.
 * @remarks Weak identity lets later declaration features verify genuine definitions without
 * exposing a public brand or retaining definitions after application code releases them.
 */
export class TemplateDefinitionRegistry {
    /** @description Genuine normalized template definitions created by this package instance. */
    readonly #definitions = new WeakSet<object>();

    /**
     * @description Registers one newly normalized template definition identity.
     * @typeParam State - Read-only object supplied to each Renderer occurrence.
     * @param definition - Frozen normalized definition created by the package normalizer.
     * @returns Nothing.
     */
    register<State extends object>(definition: TemplateDefinition<State>): void {
        this.#definitions.add(definition);
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
}
