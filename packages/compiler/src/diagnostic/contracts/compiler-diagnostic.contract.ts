import type { CompilerSourceSpan } from "../../source/contracts/compiler-source-span.contract.js";
import type { CompilerDiagnosticCodeType } from "../types/compiler-diagnostic-code.type.js";
import type { CompilerDiagnosticSeverityType } from "../types/compiler-diagnostic-severity.type.js";
import type { CompilerRelatedDiagnostic } from "./compiler-related-diagnostic.contract.js";

/** @description Immutable source-located failure produced for invalid or unsupported Lily source. */
export interface CompilerDiagnostic {
    /** @description Stable stage-specific LILY diagnostic identity. */
    readonly code: CompilerDiagnosticCodeType;

    /** @description Stable diagnostic severity, initially restricted to errors. */
    readonly severity: CompilerDiagnosticSeverityType;

    /** @description Concise deterministic message without terminal presentation. */
    readonly message: string;

    /** @description Explicit normalized source identity containing the primary range. */
    readonly filename: string;

    /** @description Exact primary source range used for ordering and presentation. */
    readonly span: CompilerSourceSpan;

    /** @description Ordered immutable secondary source relationships. */
    readonly related: readonly CompilerRelatedDiagnostic[];
}
