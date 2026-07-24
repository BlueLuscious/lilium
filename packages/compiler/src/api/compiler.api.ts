import { LilyAnalyzer } from "../analysis/runtime/lily-analyzer.js";
import type { CompilerResult } from "../compilation/contracts/compiler-result.contract.js";
import type { CompilerOptionsType } from "../compilation/types/compiler-options.type.js";
import { LilyGenerator } from "../generator/runtime/lily-generator.js";
import { LilyParser } from "../parser/runtime/lily-parser.js";
import type { CompilerApi } from "./contracts/compiler-api.contract.js";

/** @description Frozen stateless public facade for the pure Lily compilation pipeline. */
export const Compiler: CompilerApi = Object.freeze({
    /**
     * @description Compiles explicit Lily source into deterministic ES2022 ESM or diagnostics.
     * @param source - Complete caller-supplied Lily source text.
     * @param options - Explicit caller-owned source identity.
     * @returns Immutable generated output and ordered diagnostics.
     */
    compile(source: string, options: CompilerOptionsType): CompilerResult {
        if (typeof source !== "string") {
            throw new TypeError("Compiler source must be a string.");
        }
        if (
            typeof options !== "object" ||
            options === null ||
            typeof options.filename !== "string" ||
            options.filename.trim().length === 0
        ) {
            throw new TypeError("Compiler options require a non-empty filename.");
        }

        const parsed = new LilyParser(source, options.filename).parse();
        const analyzed = new LilyAnalyzer(source, options.filename).analyze(parsed);

        if (analyzed.ir === undefined) {
            return Object.freeze({
                output: undefined,
                diagnostics: analyzed.diagnostics,
            });
        }

        return Object.freeze({
            output: new LilyGenerator(source, options.filename).generate(analyzed.ir),
            diagnostics: analyzed.diagnostics,
        });
    },
});
