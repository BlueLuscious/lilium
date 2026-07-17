import type { TemplateBindingEqualityType } from "./template-binding-equality.type.js";

/**
 * @description Optional behavior used when declaring one dynamic property binding.
 * @typeParam Value - Candidate and committed binding value type.
 */
export type TemplateBindingOptionsType<Value> = Readonly<{
    /** @description Equality operation, defaulting to `Object.is` when omitted. */
    equal?: TemplateBindingEqualityType<Value>;
}>;
