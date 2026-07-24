import type { CompilerSourceSpan } from "../../../source/contracts/compiler-source-span.contract.js";
import type { ICompilerImportIr } from "./compiler-import-ir.contract.js";
import type { ICompilerNodeIr } from "./compiler-node-ir.contract.js";

/** @description Complete validated generator-oriented representation of one Lily module. */
export interface ICompilerModuleIr {
    /** @description Ordered validated source imports. */
    readonly imports: readonly ICompilerImportIr[];

    /** @description Exact local headless behavior definition name. */
    readonly behavior: string;

    /** @description Ordered normalized root primitive nodes. */
    readonly roots: readonly ICompilerNodeIr[];

    /** @description Complete original source range. */
    readonly span: CompilerSourceSpan;
}
