import type { CompilerDiagnostic } from "../../../diagnostic/contracts/compiler-diagnostic.contract.js";
import type { ICompilerFileSyntax } from "./compiler-file-syntax.contract.js";

/** @description Immutable recoverable syntax tree and ordered lexer/parser diagnostics. */
export interface ICompilerParseResult {
    /** @description Concrete syntax tree containing every safely recovered declaration. */
    readonly syntax: ICompilerFileSyntax;

    /** @description Deterministically ordered lexical and parsing diagnostics. */
    readonly diagnostics: readonly CompilerDiagnostic[];
}
