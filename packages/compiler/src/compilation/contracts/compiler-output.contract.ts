import type { CompilerSourceMap } from "../../source-map/contracts/compiler-source-map.contract.js";

/** @description Successful deterministic JavaScript module and its matching source map. */
export interface CompilerOutput {
    /** @description Readable ES2022 ESM terminated by one final LF character. */
    readonly code: string;

    /** @description Version 3 source map for the exact generated code. */
    readonly map: CompilerSourceMap;
}
