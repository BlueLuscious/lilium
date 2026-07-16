import type { TemplateReferenceType } from "../../definition/types/template-reference.type.js";
import type { TemplateProjection } from "../../slot/contracts/template-projection.contract.js";
import type { TemplateComponentInputEvaluatorType } from "../types/template-component-input-evaluator.type.js";

/**
 * @description Immutable declaration for one nested templated-component occurrence.
 * @remarks Child generic relationships are validated by `Template.component()` and intentionally
 * erased from the stored protocol record so heterogeneous component declarations share a fragment.
 * @typeParam ParentState - Read-only state of the declaring parent template.
 * @typeParam Reference - Normalized reference type or `undefined` before definition creation.
 */
export interface TemplateComponent<
    ParentState extends object,
    Reference extends TemplateReferenceType | undefined = TemplateReferenceType | undefined,
> {
    /** @description Discriminant identifying a nested component declaration. */
    readonly kind: "component";

    /** @description Definition-local identity assigned during normalization. */
    readonly reference: Reference;

    /** @description Templated component identity retained without runtime instantiation. */
    readonly component: object;

    /** @description Typed input evaluator erased to its immutable protocol result. */
    readonly inputs: TemplateComponentInputEvaluatorType<ParentState, object>;

    /** @description Ordered static projected-content declarations. */
    readonly projections: readonly TemplateProjection<ParentState, object>[];
}
