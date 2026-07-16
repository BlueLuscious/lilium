import type { TemplateFragmentType } from "./template-fragment.type.js";

/**
 * @description Caller-owned root declarations accepted by template definition normalization.
 * @typeParam State - Read-only state supplied to each template occurrence.
 */
export type TemplateDefinitionOptionsType<State extends object> = Readonly<{
    /** @description Ordered unnormalized root fragment copied by `Template.define()`. */
    roots: TemplateFragmentType<State, undefined>;
}>;
