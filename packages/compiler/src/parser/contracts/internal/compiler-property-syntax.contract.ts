import type { CompilerSourceSpan } from "../../../source/contracts/compiler-source-span.contract.js";
import type { TCompilerPropertyKind } from "../../types/internal/compiler-property-kind.type.js";
import type { ICompilerExpressionSyntax } from "./compiler-expression-syntax.contract.js";

/** @description One static or reactive property declaration nested in a primitive node. */
export interface ICompilerPropertySyntax {
    /** @description Stable syntax discriminant. */
    readonly kind: "property";

    /** @description Whether the property uses static value or reactive binding semantics. */
    readonly propertyKind: TCompilerPropertyKind;

    /** @description Exact referenced property local name. */
    readonly name: string;

    /** @description Exact property identifier source range. */
    readonly nameSpan: CompilerSourceSpan;

    /** @description Exact expression syntax retained for semantic analysis. */
    readonly expression: ICompilerExpressionSyntax;

    /** @description Complete declaration range including its semicolon when present. */
    readonly span: CompilerSourceSpan;
}
