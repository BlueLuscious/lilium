import type { TemplateFragmentType } from "../../definition/types/template-fragment.type.js";
import type { TemplateReferenceType } from "../../definition/types/template-reference.type.js";
import type { TemplatePropertyInstructionType } from "../types/template-property-instruction.type.js";
import type { TemplatePrimitive } from "./template-primitive.contract.js";

/**
 * @description Immutable primitive-node declaration in one template fragment.
 * @typeParam State - Read-only template occurrence state.
 * @typeParam Primitive - Portable primitive capability instantiated by Renderer.
 * @typeParam Reference - Normalized reference type or `undefined` before definition creation.
 */
export interface TemplateNode<
    State extends object,
    Primitive extends TemplatePrimitive<object> = TemplatePrimitive<object>,
    Reference extends TemplateReferenceType | undefined = TemplateReferenceType | undefined,
> {
    /** @description Discriminant identifying a primitive node declaration. */
    readonly kind: "node";

    /** @description Definition-local identity assigned during normalization. */
    readonly reference: Reference;

    /** @description Portable primitive capability represented by this node. */
    readonly primitive: Primitive;

    /** @description Ordered static values and dynamic bindings for this primitive. */
    readonly properties: readonly TemplatePropertyInstructionType<State, Primitive, Reference>[];

    /** @description Ordered child fragment instantiated beneath this primitive. */
    readonly children: TemplateFragmentType<State, Reference>;
}
