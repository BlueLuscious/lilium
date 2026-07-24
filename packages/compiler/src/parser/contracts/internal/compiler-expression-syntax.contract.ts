import type { CompilerSourceSpan } from "../../../source/contracts/compiler-source-span.contract.js";

/**
 * @description One source-located expression retained for dedicated semantic analysis.
 * @remarks The parser preserves exact spelling and balanced boundaries, while semantic expression
 * validation remains the analyzer's responsibility.
 */
export interface ICompilerExpressionSyntax {
    /** @description Exact expression spelling excluding surrounding assignment and semicolon. */
    readonly raw: string;

    /** @description Exact expression range after trimming source whitespace. */
    readonly span: CompilerSourceSpan;
}
