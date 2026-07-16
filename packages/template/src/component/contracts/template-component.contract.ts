import type { TemplateReferenceType } from "../../definition/types/template-reference.type.js";
import type { TemplateProjection } from "../../slot/contracts/template-projection.contract.js";
import type { TemplateComponentInputType } from "../types/template-component-input.type.js";

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

    /** @description Static or dynamic complete-input declaration erased to the protocol shape. */
    readonly inputs: TemplateComponentInputType<ParentState, object>;

    /** @description Ordered static projected-content declarations. */
    readonly projections: readonly TemplateProjection<ParentState, object>[];
}
