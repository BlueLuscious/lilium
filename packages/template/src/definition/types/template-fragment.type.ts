import type { TemplateInstructionType } from "./template-instruction.type.js";
import type { TemplateReferenceType } from "./template-reference.type.js";

/**
 * @description Ordered immutable template declarations sharing one occurrence state.
 * @typeParam State - Read-only template occurrence state.
 * @typeParam Reference - Normalized reference type or `undefined` before definition creation.
 */
export type TemplateFragmentType<
    State extends object,
    Reference extends TemplateReferenceType | undefined = TemplateReferenceType,
> = readonly TemplateInstructionType<State, Reference>[];
