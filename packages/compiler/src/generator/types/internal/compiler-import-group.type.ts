import type { CompilerSourceSpan } from "../../../source/contracts/compiler-source-span.contract.js";

/** @description Mutable generation-only aggregation of names imported from one user module. */
export type TCompilerImportGroup = {
    /** @description Exact quoted source module specifier. */
    source: string;

    /** @description Unique local names collected before lexical sorting. */
    names: Set<string>;

    /** @description First source import span representing the generated merged declaration. */
    span: CompilerSourceSpan;
};
