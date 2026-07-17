import type { TemplateFragmentType } from "../../definition/types/template-fragment.type.js";
import type { TemplatePrimitive } from "../contracts/template-primitive.contract.js";
import type { TemplatePropertyInstructionType } from "./template-property-instruction.type.js";

/**
 * @description Caller-owned declaration values accepted when creating one primitive node.
 * @typeParam State - Read-only template occurrence state.
 * @typeParam Primitive - Portable primitive capability represented by the node.
 */
export type TemplateNodeOptionsType<
    State extends object,
    Primitive extends TemplatePrimitive<object>,
> = Readonly<{
    /** @description Ordered static values and unnormalized bindings for this primitive. */
    properties?: readonly TemplatePropertyInstructionType<State, Primitive, undefined>[];

    /** @description Ordered unnormalized child declarations. */
    children?: TemplateFragmentType<State, undefined>;
}>;
