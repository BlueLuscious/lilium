/** @description One deterministic position in caller-supplied Lily source text. */
export interface CompilerSourcePosition {
    /** @description Zero-based UTF-16 code-unit offset from the start of the source. */
    readonly offset: number;

    /** @description One-based source line after CRLF-aware line-break accounting. */
    readonly line: number;

    /** @description One-based UTF-16 code-unit column within the source line. */
    readonly column: number;
}
