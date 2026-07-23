import type { ConsolePrimitiveDefinition } from "../../capability/contracts/console-primitive-definition.contract.js";
import type { ConsolePrimitiveType } from "../../host/types/console-primitive.type.js";
import type { ConsolePropertyType } from "../../host/types/console-property.type.js";

/** @description Assigns deterministic session-local identifiers to capability object identities. */
export class ConsoleIdentityRegistry {
    /** @description Primitive identifiers seeded by host declaration order. */
    readonly #primitives = new Map<ConsolePrimitiveType, number>();
    /** @description Property identifiers seeded by declaration and property order. */
    readonly #properties = new Map<ConsolePropertyType, number>();

    /**
     * @description Seeds deterministic identifiers from one normalized host capability list.
     * @param definitions - Primitive declarations in host configuration order.
     */
    constructor(definitions: readonly ConsolePrimitiveDefinition[]) {
        for (const definition of definitions) {
            this.primitive(definition.primitive);

            for (const property of definition.properties) {
                this.property(property);
            }
        }
    }

    /**
     * @description Resolves or assigns one deterministic primitive identifier.
     * @param primitive - Exact Template primitive object identity.
     * @returns Zero-based session-local primitive identifier.
     */
    primitive(primitive: ConsolePrimitiveType): number {
        const existing = this.#primitives.get(primitive);

        if (existing !== undefined) {
            return existing;
        }

        const identifier = this.#primitives.size;
        this.#primitives.set(primitive, identifier);
        return identifier;
    }

    /**
     * @description Resolves or assigns one deterministic property identifier.
     * @param property - Exact Template property object identity.
     * @returns Zero-based session-local property identifier.
     */
    property(property: ConsolePropertyType): number {
        const existing = this.#properties.get(property);

        if (existing !== undefined) {
            return existing;
        }

        const identifier = this.#properties.size;
        this.#properties.set(property, identifier);
        return identifier;
    }
}
