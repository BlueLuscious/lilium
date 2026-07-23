import type { CompilerDiagnostic } from "../../diagnostic/contracts/compiler-diagnostic.contract.js";
import type { CompilerOutput } from "./compiler-output.contract.js";

/**
 * @description Immutable result of one pure Compiler invocation.
 * @remarks Output is absent whenever at least one error diagnostic exists. Ordered diagnostics
 * remain present for both successful and unsuccessful compilation.
 */
export interface CompilerResult {
    /** @description Generated module and source map, or undefined after source errors. */
    readonly output: CompilerOutput | undefined;

    /** @description Deterministically ordered immutable compiler diagnostics. */
    readonly diagnostics: readonly CompilerDiagnostic[];
}
