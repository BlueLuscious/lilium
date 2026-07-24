import type { CompilerDiagnostic } from "../../../diagnostic/contracts/compiler-diagnostic.contract.js";
import type { ICompilerToken } from "./compiler-token.contract.js";

/** @description Immutable tokens and lexical diagnostics produced for one complete Lily source. */
export interface ICompilerLexResult {
    /** @description Ordered tokens including comments and one terminal EOF token. */
    readonly tokens: readonly ICompilerToken[];

    /** @description Deterministically ordered lexical diagnostics. */
    readonly diagnostics: readonly CompilerDiagnostic[];
}
