import type { CompilerSourceSpan } from "../../source/contracts/compiler-source-span.contract.js";

/** @description Secondary source context attached to one primary compiler diagnostic. */
export interface CompilerRelatedDiagnostic {
    /** @description Concise explanation of the related source relationship. */
    readonly message: string;

    /** @description Explicit normalized source identity containing the related range. */
    readonly filename: string;

    /** @description Exact related source range. */
    readonly span: CompilerSourceSpan;
}
