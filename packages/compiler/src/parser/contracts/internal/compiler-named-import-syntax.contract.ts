import type { CompilerSourceSpan } from "../../../source/contracts/compiler-source-span.contract.js";

/** @description One source-located local name in a Lily named import list. */
export interface ICompilerNamedImportSyntax {
    /** @description Exact local identifier spelling. */
    readonly name: string;

    /** @description Exact identifier source range. */
    readonly span: CompilerSourceSpan;
}
