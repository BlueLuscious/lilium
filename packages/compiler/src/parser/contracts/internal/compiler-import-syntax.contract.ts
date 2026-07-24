import type { CompilerSourceSpan } from "../../../source/contracts/compiler-source-span.contract.js";
import type { TCompilerImportKind } from "../../types/internal/compiler-import-kind.type.js";
import type { ICompilerNamedImportSyntax } from "./compiler-named-import-syntax.contract.js";
import type { ICompilerStringSyntax } from "./compiler-string-syntax.contract.js";

/** @description One recoverably parsed top-level Lily import declaration. */
export interface ICompilerImportSyntax {
    /** @description Stable syntax discriminant. */
    readonly kind: "import";

    /** @description Imported capability category declared by the source keyword. */
    readonly importKind: TCompilerImportKind;

    /** @description Ordered named local imports exactly as authored. */
    readonly names: readonly ICompilerNamedImportSyntax[];

    /** @description Exact source module string syntax. */
    readonly source: ICompilerStringSyntax;

    /** @description Complete declaration range including its semicolon when present. */
    readonly span: CompilerSourceSpan;
}
