import type { TemplatePrimitive, TemplateProperty } from "@lilium/template";

/**
 * @description Host implementation of one exact typed Template property capability.
 * @typeParam Value - Opaque host value handle receiving property writes.
 * @typeParam Primitive - Template primitive that owns the property identity.
 * @typeParam PropertyValue - Candidate value accepted by the property.
 */
export interface RendererPropertyCapability<
    Value extends object,
    Primitive extends TemplatePrimitive<object>,
    PropertyValue,
> {
    /** @description Exact Template property identity implemented by this capability. */
    readonly property: TemplateProperty<Primitive, PropertyValue>;

    /**
     * @description Atomically commits one candidate value to an existing host value.
     * @param value - Live opaque host value created for the owning primitive.
     * @param candidate - Static or evaluated property value to commit.
     * @returns Nothing on synchronous success.
     */
    write(value: Value, candidate: PropertyValue): void;
}
