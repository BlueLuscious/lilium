import type { ComponentInputValuesType } from "@lilium/component";
import type { TemplateProjection } from "../../slot/contracts/template-projection.contract.js";
import type { TemplateComponentInputEvaluatorType } from "./template-component-input-evaluator.type.js";

/**
 * @description Caller-owned declaration values accepted for one nested templated component.
 * @typeParam ParentState - Read-only state of the declaring parent template.
 * @typeParam ChildInputs - Complete input shape required by the child component.
 */
export type TemplateComponentOptionsType<
    ParentState extends object,
    ChildInputs extends object,
> = Readonly<{
    /** @description Static complete snapshot or pure evaluator producing complete child inputs. */
    inputs:
        | ComponentInputValuesType<ChildInputs>
        | TemplateComponentInputEvaluatorType<ParentState, ChildInputs>;

    /** @description Ordered projected content keyed by accepted slot identities. */
    projections?: readonly TemplateProjection<ParentState, object>[];
}>;
