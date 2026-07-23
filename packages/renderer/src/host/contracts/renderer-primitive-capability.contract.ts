import type { TemplatePrimitive, TemplateProperty } from "@lilium/template";
import type { RendererPropertyCapability } from "./renderer-property-capability.contract.js";

/**
 * @description Host implementation of one exact portable Template primitive identity.
 * @typeParam Parent - Opaque host handle that may receive child values.
 * @typeParam Value - Opaque host value handle created by this capability.
 * @typeParam Primitive - Exact Template primitive identity implemented by this capability.
 */
export interface RendererPrimitiveCapability<
    Parent extends object,
    Value extends Parent,
    Primitive extends TemplatePrimitive<object>,
> {
    /** @description Exact Template primitive identity implemented by this capability. */
    readonly primitive: Primitive;

    /** @description Whether created values may receive placed child values. */
    readonly acceptsChildren: boolean;

    /**
     * @description Creates one detached opaque host value.
     * @returns A stable value handle that remains valid until permanent release.
     */
    create(): Value;

    /**
     * @description Resolves support for one exact property owned by this primitive.
     * @typeParam PropertyValue - Value type accepted by the requested property.
     * @param property - Exact Template property identity requested during preflight.
     * @returns Its host capability, or `undefined` when unsupported.
     */
    resolveProperty<PropertyValue>(
        property: TemplateProperty<Primitive, PropertyValue>,
    ): RendererPropertyCapability<Value, Primitive, PropertyValue> | undefined;

    /**
     * @description Permanently releases one detached value and its host-specific resources.
     * @remarks Renderer treats the handle as terminal before invoking this operation.
     * @param value - Detached live value created by this capability.
     * @returns Nothing on synchronous completion.
     */
    release(value: Value): void;
}
