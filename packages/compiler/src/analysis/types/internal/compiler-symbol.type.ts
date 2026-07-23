import type { CompilerSourceSpan } from "../../../source/contracts/compiler-source-span.contract.js";
import type { TCompilerSymbolCategory } from "./compiler-symbol-category.type.js";

/** @description One local imported symbol retained by semantic resolution. */
export type TCompilerSymbol = Readonly<{
    /** @description Local imported source name. */
    name: string;

    /** @description Capability category assigned by its import declaration. */
    category: TCompilerSymbolCategory;

    /** @description Exact original local-name source range. */
    span: CompilerSourceSpan;
}>;
