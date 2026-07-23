import type { TCompilerImportKind } from "../../../parser/types/internal/compiler-import-kind.type.js";
import type { CompilerSourceSpan } from "../../../source/contracts/compiler-source-span.contract.js";

/** @description One validated source import retained for deterministic module generation. */
export interface ICompilerImportIr {
    /** @description Validated import capability category. */
    readonly kind: TCompilerImportKind;

    /** @description Ordered local names exactly as declared by the source. */
    readonly names: readonly string[];

    /** @description Exact quoted module specifier retained for generation. */
    readonly source: string;

    /** @description Complete original import declaration range. */
    readonly span: CompilerSourceSpan;
}
