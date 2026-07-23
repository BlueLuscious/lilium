import type { CompilerSourceSpan } from "../../../source/contracts/compiler-source-span.contract.js";
import type { ICompilerExpressionIr } from "./compiler-expression-ir.contract.js";

/** @description One validated primitive property declaration in normalized compiler IR. */
export interface ICompilerPropertyIr {
    /** @description Resolved local property capability name. */
    readonly property: string;

    /** @description Validated normalized static or binding expression. */
    readonly expression: ICompilerExpressionIr;

    /** @description Exact property identifier range used by generated mappings. */
    readonly propertySpan: CompilerSourceSpan;

    /** @description Complete original property declaration range. */
    readonly span: CompilerSourceSpan;
}
