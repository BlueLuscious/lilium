/**
 * @description Mutable state isolated to one synchronous template normalization pass.
 * @remarks The active set detects recursive declaration paths while the counter assigns one
 * deterministic depth-first ordinal across nodes and bindings.
 */
export type TTemplateNormalizationContext = {
    /** @description Declarations in the current recursive traversal path. */
    readonly active: WeakSet<object>;

    /** @description Next definition-local reference ordinal to assign. */
    nextReference: number;
};
