import type { CompilerSourceSpan } from "../../../source/contracts/compiler-source-span.contract.js";
import type { ICompilerPropertyIr } from "./compiler-property-ir.contract.js";

/** @description One validated primitive node normalized into separate property and child sequences. */
export interface ICompilerNodeIr {
    /** @description Resolved local primitive capability name. */
    readonly primitive: string;

    /** @description Ordered validated properties authored before child declarations. */
    readonly properties: readonly ICompilerPropertyIr[];

    /** @description Ordered recursively normalized child primitive nodes. */
    readonly children: readonly ICompilerNodeIr[];

    /** @description Exact primitive identifier range used by generated mappings. */
    readonly primitiveSpan: CompilerSourceSpan;

    /** @description Complete original node declaration range. */
    readonly span: CompilerSourceSpan;
}
