import type { TemplatePrimitive } from "./template-primitive.contract.js";
import type { TemplateProperty } from "./template-property.contract.js";

/**
 * @description Immutable declaration that applies one property value during instantiation.
 * @remarks Template owns and freezes this declaration container but retains the supplied
 * application value by reference without recursively freezing it.
 * @typeParam Primitive - Primitive identity that owns the property.
 * @typeParam Value - Static property value type.
 */
export interface TemplateStaticValue<
    Primitive extends TemplatePrimitive<object> = TemplatePrimitive<object>,
    Value = unknown,
> {
    /** @description Discriminant identifying a static property value declaration. */
    readonly kind: "value";

    /** @description Property capability receiving the static value. */
    readonly property: TemplateProperty<Primitive, Value>;

    /** @description Application value applied once during template instantiation. */
    readonly value: Value;
}
