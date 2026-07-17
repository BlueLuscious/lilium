import type { TemplateSlot } from "../../../slot/contracts/template-slot.contract.js";

/**
 * @description Mutable state isolated to one synchronous template normalization pass.
 * @remarks The active set detects recursive declaration paths, the counter assigns one
 * deterministic depth-first ordinal, and slot collections enforce definition-level uniqueness.
 */
export type TTemplateNormalizationContext = {
    /** @description Declarations in the current recursive traversal path. */
    readonly active: WeakSet<object>;

    /** @description Next definition-local reference ordinal to assign. */
    nextReference: number;

    /** @description Genuine slot identities already placed by an outlet in this definition. */
    readonly slotIdentities: Set<object>;

    /** @description Slots indexed by normalized name in deterministic traversal order. */
    readonly slotsByName: Map<string, TemplateSlot<object>>;
};
