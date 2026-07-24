import type { CompilerResult } from "../../compilation/contracts/compiler-result.contract.js";
import type { CompilerOptionsType } from "../../compilation/types/compiler-options.type.js";

/**
 * @description Stateless object API for compiling explicit Lily source into deterministic modules.
 * @remarks The frozen `Compiler` value implements this contract through the complete lexer,
 * parser, analysis, and generation pipeline. Compilation never performs file-system access,
 * module loading, logging, process termination, or host rendering.
 */
export interface CompilerApi {
    /**
     * @description Compiles one complete Lily source string through the pure compiler pipeline.
     * @param source - Complete source text supplied directly by the caller.
     * @param options - Explicit source identity and compilation options.
     * @returns Immutable output and ordered diagnostics determined only by the arguments.
     */
    compile(source: string, options: CompilerOptionsType): CompilerResult;
}
