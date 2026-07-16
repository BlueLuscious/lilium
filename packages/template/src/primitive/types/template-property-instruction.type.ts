import type { TemplateBinding } from "../../binding/contracts/template-binding.contract.js";
import type { TemplateReferenceType } from "../../definition/types/template-reference.type.js";
import type { TemplatePrimitive } from "../contracts/template-primitive.contract.js";
import type { TemplateStaticValue } from "../contracts/template-static-value.contract.js";

/**
 * @description Static or dynamic property declaration accepted by one primitive node.
 * @typeParam State - Read-only template occurrence state.
 * @typeParam Primitive - Primitive identity that owns every declared property.
 * @typeParam Reference - Normalized reference type or `undefined` before definition creation.
 */
export type TemplatePropertyInstructionType<
    State extends object,
    Primitive extends TemplatePrimitive<object>,
    Reference extends TemplateReferenceType | undefined,
> = TemplateStaticValue<Primitive, unknown> | TemplateBinding<State, Primitive, unknown, Reference>;
