import type { TemplateFragmentType } from "../../definition/types/template-fragment.type.js";
import type { TemplateReferenceType } from "../../definition/types/template-reference.type.js";
import type { TemplateSlotInputEvaluatorType } from "../types/template-slot-input-evaluator.type.js";
import type { TemplateSlot } from "./template-slot.contract.js";

/**
 * @description Immutable declaration placing one slot identity in a child template fragment.
 * @typeParam State - Read-only state of the receiving child template.
 * @typeParam Inputs - Complete value shape supplied to projected content.
 * @typeParam Reference - Normalized reference type or `undefined` before definition creation.
 */
export interface TemplateOutlet<
    State extends object,
    Inputs extends object = object,
    Reference extends TemplateReferenceType | undefined = TemplateReferenceType | undefined,
> {
    /** @description Discriminant identifying a slot outlet declaration. */
    readonly kind: "outlet";

    /** @description Definition-local identity assigned during normalization. */
    readonly reference: Reference;

    /** @description Slot identity placed by this outlet. */
    readonly slot: TemplateSlot<Inputs>;

    /** @description Pure evaluator producing each complete slot-input snapshot. */
    readonly inputs: TemplateSlotInputEvaluatorType<State, Inputs>;

    /** @description Optional child-owned fallback declarations used without a projection. */
    readonly fallback: TemplateFragmentType<State, Reference>;
}
