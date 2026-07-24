import type { CompilerDiagnostic } from "../../../diagnostic/contracts/compiler-diagnostic.contract.js";
import type { ICompilerModuleIr } from "../../../ir/contracts/internal/compiler-module-ir.contract.js";

/** @description Immutable semantic diagnostics and optional error-free compiler IR. */
export interface ICompilerAnalysisResult {
    /** @description Generator-oriented IR, absent whenever any compiler error exists. */
    readonly ir: ICompilerModuleIr | undefined;

    /** @description Deterministically ordered parser and semantic diagnostics. */
    readonly diagnostics: readonly CompilerDiagnostic[];
}
