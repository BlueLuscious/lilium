import type { CompilerSourceSpan } from "../../../source/contracts/compiler-source-span.contract.js";

/**
 * @description One source-located expression retained for dedicated semantic analysis.
 * @remarks Phase 01 preserves exact spelling and balanced boundaries without validating expression purity.
 */
export interface ICompilerExpressionSyntax {
    /** @description Exact expression spelling excluding surrounding assignment and semicolon. */
    readonly raw: string;

    /** @description Exact expression range after trimming source whitespace. */
    readonly span: CompilerSourceSpan;
}
