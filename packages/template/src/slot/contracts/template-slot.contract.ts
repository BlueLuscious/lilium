/** @description Type-only slot input schema retained without a public runtime member. */
declare const TEMPLATE_SLOT_INPUTS: unique symbol;

/**
 * @description Stable named identity for one projection point and its input schema.
 * @remarks Slot identity uses object equality. The immutable name exists for authoring,
 * compiler analysis, and diagnostics rather than runtime identity comparison.
 * @typeParam Inputs - Complete value shape supplied by the receiving child template.
 */
export interface TemplateSlot<Inputs extends object = object> {
    /** @description Immutable normalized slot name. */
    readonly name: string;

    /** @description Type-only input schema carried by this slot identity. */
    readonly [TEMPLATE_SLOT_INPUTS]: Inputs;
}
