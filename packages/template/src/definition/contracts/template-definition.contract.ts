import type { TemplateFragmentType } from "../types/template-fragment.type.js";

/** @description Type-only occurrence state retained without a public runtime member. */
declare const TEMPLATE_DEFINITION_STATE: unique symbol;

/**
 * @description Reusable normalized immutable template program.
 * @remarks The definition stores declarations only and owns no runtime, host value, scope,
 * renderer, or mounted occurrence. Definition identity uses object equality.
 * @typeParam State - Read-only object supplied to each Renderer occurrence.
 */
export interface TemplateDefinition<State extends object> {
    /** @description Ordered normalized root fragment with definition-local references. */
    readonly roots: TemplateFragmentType<State>;

    /** @description Type-only occurrence state carried by this template identity. */
    readonly [TEMPLATE_DEFINITION_STATE]: State;
}
