/** @description Type-only primitive property schema retained without a public runtime member. */
declare const TEMPLATE_PRIMITIVE_PROPERTIES: unique symbol;

/**
 * @description Portable identity for one host-neutral primitive capability.
 * @remarks Compatible host adapters map this object identity explicitly. The diagnostic name
 * does not participate in equality and the identity contains no host creation behavior.
 * @typeParam Properties - Declarative property schema associated with the primitive.
 */
export interface TemplatePrimitive<Properties extends object = object> {
    /** @description Optional immutable diagnostic name for this primitive capability. */
    readonly name: string | undefined;

    /** @description Type-only property schema carried by this primitive identity. */
    readonly [TEMPLATE_PRIMITIVE_PROPERTIES]: Properties;
}
