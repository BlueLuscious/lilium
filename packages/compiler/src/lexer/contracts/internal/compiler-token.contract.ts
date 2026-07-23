import type { CompilerSourceSpan } from "../../../source/contracts/compiler-source-span.contract.js";
import type { TCompilerTokenKind } from "../../types/internal/compiler-token-kind.type.js";

/** @description One immutable source-located token emitted by the internal Lily lexer. */
export interface ICompilerToken {
    /** @description Stable lexical category used by parser decisions. */
    readonly kind: TCompilerTokenKind;

    /** @description Exact source spelling covered by the token span. */
    readonly lexeme: string;

    /** @description Exact half-open range occupied by the token. */
    readonly span: CompilerSourceSpan;
}
