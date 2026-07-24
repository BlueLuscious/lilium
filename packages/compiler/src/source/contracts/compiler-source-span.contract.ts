import type { CompilerSourcePosition } from "./compiler-source-position.contract.js";

/** @description Half-open source range preserving exact offsets and human-facing locations. */
export interface CompilerSourceSpan {
    /** @description Inclusive first source position belonging to the range. */
    readonly start: CompilerSourcePosition;

    /** @description Exclusive source position immediately after the range. */
    readonly end: CompilerSourcePosition;
}
