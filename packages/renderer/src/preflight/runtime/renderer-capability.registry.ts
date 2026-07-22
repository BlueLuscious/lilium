import type { TemplatePrimitive, TemplateProperty } from "@lilium/template";
import type { RendererPrimitiveCapability } from "../../host/contracts/renderer-primitive-capability.contract.js";
import type { RendererPropertyCapability } from "../../host/contracts/renderer-property-capability.contract.js";

/**
 * @description Private immutable lookup of capabilities accepted by one completed preflight.
 * @typeParam Parent - Host value shape that can contain rendered values.
 * @typeParam Value - Concrete host value shape created by primitive capabilities.
 */
export class RendererCapabilityRegistry<Parent extends object, Value extends Parent> {
    /** @description Accepted primitive capabilities keyed by exact Template identity. */
    readonly #primitives: ReadonlyMap<
        TemplatePrimitive<object>,
        RendererPrimitiveCapability<Parent, Value, TemplatePrimitive<object>>
    >;
    /** @description Accepted property capabilities keyed by exact Template identity. */
    readonly #properties: ReadonlyMap<
        TemplateProperty,
        RendererPropertyCapability<Value, TemplatePrimitive<object>, unknown>
    >;

    /**
     * @description Creates one lookup from fully validated capability maps.
     * @param primitives - Primitive capabilities keyed by exact Template identity.
     * @param properties - Property capabilities keyed by exact Template identity.
     */
    constructor(
        primitives: ReadonlyMap<
            TemplatePrimitive<object>,
            RendererPrimitiveCapability<Parent, Value, TemplatePrimitive<object>>
        >,
        properties: ReadonlyMap<
            TemplateProperty,
            RendererPropertyCapability<Value, TemplatePrimitive<object>, unknown>
        >,
    ) {
        this.#primitives = new Map(primitives);
        this.#properties = new Map(properties);
    }

    /**
     * @description Returns the accepted capability for one exact required primitive.
     * @typeParam Primitive - Exact Template primitive identity.
     * @param primitive - Required primitive whose preflight already succeeded.
     * @returns Its validated host capability.
     */
    primitive<Primitive extends TemplatePrimitive<object>>(
        primitive: Primitive,
    ): RendererPrimitiveCapability<Parent, Value, Primitive> {
        const capability = this.#primitives.get(primitive);

        if (capability === undefined) {
            throw new TypeError("The Template primitive was not accepted by this preflight.");
        }

        return capability as RendererPrimitiveCapability<Parent, Value, Primitive>;
    }

    /**
     * @description Returns the accepted capability for one exact required property.
     * @typeParam Primitive - Template primitive that owns the property.
     * @typeParam PropertyValue - Candidate value accepted by the property.
     * @param property - Required property whose preflight already succeeded.
     * @returns Its validated host capability.
     */
    property<Primitive extends TemplatePrimitive<object>, PropertyValue>(
        property: TemplateProperty<Primitive, PropertyValue>,
    ): RendererPropertyCapability<Value, Primitive, PropertyValue> {
        const capability = this.#properties.get(property);

        if (capability === undefined) {
            throw new TypeError("The Template property was not accepted by this preflight.");
        }

        return capability as RendererPropertyCapability<Value, Primitive, PropertyValue>;
    }
}
