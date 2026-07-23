import type { CompilerDiagnosticCodeType } from "../../../diagnostic/types/compiler-diagnostic-code.type.js";

/** @description Internal immutable diagnostic metadata assigned to one unsupported Lily keyword. */
export type TCompilerUnsupportedKeyword = Readonly<{
    /** @description Stable unsupported-feature diagnostic identity. */
    code: CompilerDiagnosticCodeType;

    /** @description Deterministic unsupported-feature diagnostic message. */
    message: string;
}>;
