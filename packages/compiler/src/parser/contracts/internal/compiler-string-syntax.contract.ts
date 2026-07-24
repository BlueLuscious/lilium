import type { CompilerSourceSpan } from "../../../source/contracts/compiler-source-span.contract.js";

/** @description One source-located quoted string retained without premature semantic decoding. */
export interface ICompilerStringSyntax {
    /** @description Exact quoted source spelling including delimiters and escapes. */
    readonly raw: string;

    /** @description Exact complete string token source range. */
    readonly span: CompilerSourceSpan;
}
