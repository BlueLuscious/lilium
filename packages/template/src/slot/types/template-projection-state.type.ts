import type { TemplateSlotInputsType } from "./template-slot-inputs.type.js";

/**
 * @description Read-only state evaluated by content projected from one parent template.
 * @typeParam ParentState - State retained from the supplying parent occurrence.
 * @typeParam SlotInputs - Reactive input shape supplied by the receiving slot outlet.
 */
export type TemplateProjectionStateType<
    ParentState extends object,
    SlotInputs extends object,
> = Readonly<{
    /** @description Supplying parent template state. */
    parent: Readonly<ParentState>;

    /** @description Stable read-only reactive input signals owned by the projection. */
    slot: TemplateSlotInputsType<SlotInputs>;
}>;
