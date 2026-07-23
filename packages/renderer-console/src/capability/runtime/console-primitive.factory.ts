import type { ConsolePrimitiveType } from "../../host/types/console-primitive.type.js";
import type { ConsolePropertyType } from "../../host/types/console-property.type.js";
import type { ConsolePrimitiveDefinition } from "../contracts/console-primitive-definition.contract.js";
import type { ConsolePrimitiveOptionsType } from "../types/console-primitive-options.type.js";
import type { ConsolePrimitiveRegistry } from "./console-primitive.registry.js";

/** @description Validates and freezes logical Console primitive capability declarations. */
export class ConsolePrimitiveFactory {
    /** @description Nominal declaration registry shared with Console host creation. */
    readonly #registry: ConsolePrimitiveRegistry;

    /**
     * @description Creates one factory bound to its declaration identity registry.
     * @param registry - Registry accepting every normalized declaration.
     */
    constructor(registry: ConsolePrimitiveRegistry) {
        this.#registry = registry;
    }

    /**
     * @description Declares one exact logical primitive and its supported properties.
     * @typeParam Primitive - Exact Template primitive identity being implemented.
     * @param primitive - Public Template primitive identity requested by Renderer preflight.
     * @param options - Optional children and property capability declarations.
     * @returns Frozen nominal Console primitive declaration.
     */
    create<Primitive extends ConsolePrimitiveType>(
        primitive: Primitive,
        options: ConsolePrimitiveOptionsType<Primitive> = {},
    ): ConsolePrimitiveDefinition<Primitive> {
        this.#assertRecord(primitive, "Console primitive identity");
        this.#assertRecord(options, "Console primitive options");

        const propertyCandidates: unknown = Reflect.get(options, "properties") ?? [];
        if (!Array.isArray(propertyCandidates)) {
            throw new TypeError("Console primitive properties must be an array.");
        }
        const properties = propertyCandidates as readonly ConsolePropertyType<Primitive>[];

        const identities = new Set<object>();
        for (const property of properties) {
            this.#assertRecord(property, "Console property identity");

            if (property.primitive !== primitive) {
                throw new TypeError("A Console property must belong to its declared primitive.");
            }

            if (identities.has(property)) {
                throw new TypeError(
                    "A Console primitive cannot declare one property more than once.",
                );
            }

            identities.add(property);
        }

        if (options.acceptsChildren !== undefined && typeof options.acceptsChildren !== "boolean") {
            throw new TypeError("Console primitive acceptsChildren must be boolean when supplied.");
        }

        return this.#registry.register(
            Object.freeze({
                primitive,
                acceptsChildren: options.acceptsChildren ?? false,
                properties: Object.freeze([...properties]),
            }),
        );
    }

    /**
     * @description Rejects null, arrays, and primitive values at declaration boundaries.
     * @param candidate - Candidate object supplied to a Console declaration operation.
     * @param subject - Human-readable subject used by the validation error.
     * @returns Nothing when the candidate is a non-array object.
     */
    #assertRecord(candidate: unknown, subject: string): asserts candidate is object {
        if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
            throw new TypeError(`${subject} must be a non-array object.`);
        }
    }
}
