import type { CompilerSourceSpan } from "../../../source/contracts/compiler-source-span.contract.js";
import type { ICompilerPropertySyntax } from "./compiler-property-syntax.contract.js";

/** @description One primitive node declaration with ordered property and child declarations. */
export interface ICompilerNodeSyntax {
    /** @description Stable syntax discriminant. */
    readonly kind: "node";

    /** @description Exact referenced primitive local name. */
    readonly name: string;

    /** @description Exact primitive identifier source range. */
    readonly nameSpan: CompilerSourceSpan;

    /** @description Ordered declarations preserving authored property and child placement. */
    readonly declarations: readonly (ICompilerPropertySyntax | ICompilerNodeSyntax)[];

    /** @description Complete node declaration range. */
    readonly span: CompilerSourceSpan;
}
