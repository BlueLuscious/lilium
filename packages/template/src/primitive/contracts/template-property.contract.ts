import type { TemplatePrimitive } from "./template-primitive.contract.js";

/** @description Type-only property value retained without a public runtime member. */
declare const TEMPLATE_PROPERTY_VALUE: unique symbol;

/**
 * @description Typed identity for one value accepted by exactly one template primitive.
 * @remarks Primitive ownership is observable by object identity. The diagnostic name does not
 * participate in equality and unsupported properties are Renderer capability errors.
 * @typeParam Primitive - Primitive identity that owns this property.
 * @typeParam Value - Value accepted by this property.
 */
export interface TemplateProperty<
    Primitive extends TemplatePrimitive<object> = TemplatePrimitive<object>,
    Value = unknown,
> {
    /** @description Optional immutable diagnostic name for this property capability. */
    readonly name: string | undefined;

    /** @description Primitive identity that exclusively owns this property. */
    readonly primitive: Primitive;

    /** @description Type-only value carried by this property identity. */
    readonly [TEMPLATE_PROPERTY_VALUE]: Value;
}
