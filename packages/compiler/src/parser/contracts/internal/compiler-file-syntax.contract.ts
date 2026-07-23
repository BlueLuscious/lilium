import type { CompilerSourceSpan } from "../../../source/contracts/compiler-source-span.contract.js";
import type { TCompilerTopLevelSyntax } from "../../types/internal/compiler-top-level-syntax.type.js";

/** @description Recoverable source-located concrete syntax representation of one Lily file. */
export interface ICompilerFileSyntax {
    /** @description Stable syntax discriminant. */
    readonly kind: "file";

    /** @description Ordered successfully recovered top-level declarations. */
    readonly declarations: readonly TCompilerTopLevelSyntax[];

    /** @description Complete source range from offset zero through EOF. */
    readonly span: CompilerSourceSpan;
}
