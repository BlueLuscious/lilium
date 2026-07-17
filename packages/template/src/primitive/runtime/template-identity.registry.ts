import type { TemplatePrimitive } from "../contracts/template-primitive.contract.js";
import type { TemplateProperty } from "../contracts/template-property.contract.js";

/**
 * @description Internal registry that creates and nominally validates Template capability objects.
 * @remarks Weak identity prevents structural imitations from entering normalized definitions
 * without retaining capabilities after application code releases them.
 */
export class TemplateIdentityRegistry {
    /** @description Genuine primitive identities created by this package instance. */
    readonly #primitives = new WeakSet<object>();

    /** @description Genuine property identities created by this package instance. */
    readonly #properties = new WeakSet<object>();

    /**
     * @description Creates one frozen portable primitive capability identity.
     * @typeParam Properties - Declarative property schema associated with the primitive.
     * @param name - Optional diagnostic name to normalize.
     * @returns A new nominal primitive identity.
     */
    createPrimitive<Properties extends object = object>(
        name?: string,
    ): TemplatePrimitive<Properties> {
        const primitive = Object.freeze({
            name: this.#normalizeName(name, "primitive"),
        });
        this.#primitives.add(primitive);
        return primitive as unknown as TemplatePrimitive<Properties>;
    }

    /**
     * @description Creates one frozen property identity owned by a genuine primitive.
     * @typeParam Value - Value accepted by the property.
     * @typeParam Primitive - Primitive identity that owns the property.
     * @param primitive - Primitive capability that owns this property.
     * @param name - Optional diagnostic name to normalize.
     * @returns A new nominal typed property identity.
     */
    createProperty<Value, Primitive extends TemplatePrimitive<object> = TemplatePrimitive<object>>(
        primitive: Primitive,
        name?: string,
    ): TemplateProperty<Primitive, Value> {
        this.assertPrimitive(primitive);
        const property = Object.freeze({
            name: this.#normalizeName(name, "property"),
            primitive,
        });
        this.#properties.add(property);
        return property as unknown as TemplateProperty<Primitive, Value>;
    }

    /**
     * @description Verifies that a candidate is a genuine primitive identity.
     * @param primitive - Candidate supplied to a Template declaration operation.
     * @returns Nothing.
     */
    assertPrimitive(primitive: unknown): asserts primitive is TemplatePrimitive<object> {
        if (
            typeof primitive !== "object" ||
            primitive === null ||
            !this.#primitives.has(primitive)
        ) {
            throw new TypeError("A template primitive must be a genuine Template identity.");
        }
    }

    /**
     * @description Verifies that a candidate is a genuine property identity.
     * @param property - Candidate supplied to a Template declaration operation.
     * @returns Nothing.
     */
    assertProperty(property: unknown): asserts property is TemplateProperty {
        if (typeof property !== "object" || property === null || !this.#properties.has(property)) {
            throw new TypeError("A template property must be a genuine Template identity.");
        }
    }

    /**
     * @description Normalizes an optional capability name for immutable diagnostics.
     * @param name - Optional caller-provided diagnostic name.
     * @param identity - Identity family used in deterministic validation errors.
     * @returns A trimmed non-empty diagnostic name or `undefined`.
     */
    #normalizeName(name: string | undefined, identity: string): string | undefined {
        if (name === undefined) {
            return undefined;
        }

        if (typeof name !== "string" || name.trim().length === 0) {
            throw new TypeError(`A template ${identity} name must be a non-empty string.`);
        }

        return name.trim();
    }
}
