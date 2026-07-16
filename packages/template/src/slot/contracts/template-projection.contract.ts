import type { TemplateDefinition } from "../../definition/contracts/template-definition.contract.js";
import type { TemplateProjectionStateType } from "../types/template-projection-state.type.js";
import type { TemplateSlot } from "./template-slot.contract.js";

/**
 * @description Immutable declaration supplying parent-owned content to one child slot identity.
 * @typeParam ParentState - State of the supplying parent template.
 * @typeParam SlotInputs - Reactive input shape supplied by the receiving slot outlet.
 */
export interface TemplateProjection<
    ParentState extends object,
    SlotInputs extends object = object,
> {
    /** @description Child slot identity receiving this projected content. */
    readonly slot: TemplateSlot<SlotInputs>;

    /** @description Parent-owned template evaluated against parent and reactive slot state. */
    readonly template: TemplateDefinition<TemplateProjectionStateType<ParentState, SlotInputs>>;
}
