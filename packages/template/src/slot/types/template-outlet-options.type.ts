import type { TemplateFragmentType } from "../../definition/types/template-fragment.type.js";
import type { TemplateSlotInputEvaluatorType } from "./template-slot-input-evaluator.type.js";

/**
 * @description Caller-owned declaration values accepted when creating one slot outlet.
 * @typeParam State - Read-only state of the receiving child template.
 * @typeParam Inputs - Complete value shape supplied to projected content.
 */
export type TemplateOutletOptionsType<State extends object, Inputs extends object> = Readonly<{
    /** @description Pure evaluator producing a complete slot-input snapshot. */
    inputs: TemplateSlotInputEvaluatorType<State, Inputs>;

    /** @description Optional child-owned fallback declarations. */
    fallback?: TemplateFragmentType<State, undefined>;
}>;
