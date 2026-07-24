import type { TCompilerPropertyKind } from "../../../parser/types/internal/compiler-property-kind.type.js";
import type { CompilerSourceSpan } from "../../../source/contracts/compiler-source-span.contract.js";

/** @description One validated static or binding expression retained for deterministic generation. */
export interface ICompilerExpressionIr {
    /** @description Expression mode selecting static value or reactive binding generation. */
    readonly kind: TCompilerPropertyKind;

    /** @description Exact validated expression spelling. */
    readonly source: string;

    /** @description Exact original expression range used by generated mappings. */
    readonly span: CompilerSourceSpan;
}
