import type { ConsolePrimitiveDefinition } from "../contracts/console-primitive-definition.contract.js";

/** @description Owns nominal identities for package-created Console primitive declarations. */
export class ConsolePrimitiveRegistry {
    /** @description Genuine declarations created through the package facade. */
    readonly #definitions = new WeakSet<object>();

    /**
     * @description Registers one newly normalized primitive declaration identity.
     * @typeParam Definition - Exact declaration shape retained by registration.
     * @param definition - Frozen declaration produced by the package factory.
     * @returns The exact registered declaration.
     */
    register<Definition extends ConsolePrimitiveDefinition>(definition: Definition): Definition {
        this.#definitions.add(definition);
        return definition;
    }

    /**
     * @description Validates and copies one complete unique host capability declaration list.
     * @param definitions - Candidate package-created primitive declarations.
     * @returns Frozen declaration list preserving input order.
     */
    normalize(
        definitions: readonly ConsolePrimitiveDefinition[],
    ): readonly ConsolePrimitiveDefinition[] {
        if (!Array.isArray(definitions)) {
            throw new TypeError("Console host primitives must be an array.");
        }

        const primitives = new Set<object>();
        const normalized: ConsolePrimitiveDefinition[] = [];

        for (const definition of definitions) {
            if (
                typeof definition !== "object" ||
                definition === null ||
                !this.#definitions.has(definition)
            ) {
                throw new TypeError(
                    "Console hosts accept only primitive declarations created by RendererConsole.",
                );
            }

            if (primitives.has(definition.primitive)) {
                throw new TypeError("A Console host cannot declare one primitive more than once.");
            }

            primitives.add(definition.primitive);
            normalized.push(definition);
        }

        return Object.freeze(normalized);
    }
}
