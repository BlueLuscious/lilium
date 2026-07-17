import type { TemplateDefinition } from "../../definition/contracts/template-definition.contract.js";
import type { TemplateProjectionStateType } from "../types/template-projection-state.type.js";
import type { TemplateSlot } from "./template-slot.contract.js";

/** @description Type-only nominal identity retained by genuine projection declarations. */
declare const TEMPLATE_PROJECTION_IDENTITY: unique symbol;

/**
 * @description Nominal immutable declaration supplying parent-owned content to one child slot.
 * @remarks `Template.projection()` is the only public constructor and preserves the generic
 * relationship between the slot input schema and projected template state.
 * @typeParam ParentState - State of the supplying parent template.
 * @typeParam SlotInputs - Reactive input shape supplied by the receiving slot outlet.
 */
export interface TemplateProjection<
    ParentState extends object,
    SlotInputs extends object = object,
> {
    /** @description Type-only marker preventing structural projection construction. */
    readonly [TEMPLATE_PROJECTION_IDENTITY]: undefined;

    /** @description Child slot identity receiving this projected content. */
    readonly slot: TemplateSlot<SlotInputs>;

    /** @description Parent-owned template evaluated against parent and reactive slot state. */
    readonly template: TemplateDefinition<TemplateProjectionStateType<ParentState, SlotInputs>>;
}
