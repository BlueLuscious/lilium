import type { CompilerSourceSpan } from "../../../source/contracts/compiler-source-span.contract.js";
import type { ICompilerNodeSyntax } from "./compiler-node-syntax.contract.js";

/** @description One top-level Lily template block containing ordered root primitive nodes. */
export interface ICompilerTemplateSyntax {
    /** @description Stable syntax discriminant. */
    readonly kind: "template";

    /** @description Ordered root primitive declarations. */
    readonly declarations: readonly ICompilerNodeSyntax[];

    /** @description Complete template section range. */
    readonly span: CompilerSourceSpan;
}
