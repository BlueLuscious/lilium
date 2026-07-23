import type { CompilerSourceLocator } from "../../source/runtime/compiler-source-locator.js";
import type { CompilerDiagnostic } from "../contracts/compiler-diagnostic.contract.js";
import type { CompilerDiagnosticCodeType } from "../types/compiler-diagnostic-code.type.js";

/**
 * @description Creates immutable deterministic diagnostics for one compiler source.
 */
export class CompilerDiagnosticFactory {
    /** @description Explicit source identity attached to every created diagnostic. */
    readonly #filename: string;

    /** @description Source offset mapper shared by every created diagnostic. */
    readonly #locator: CompilerSourceLocator;

    /**
     * @description Creates a diagnostic factory for one explicit source.
     * @param filename - Caller-provided source identity.
     * @param locator - Source locator for the same source text.
     */
    public constructor(filename: string, locator: CompilerSourceLocator) {
        this.#filename = filename;
        this.#locator = locator;
    }

    /**
     * @description Creates one immutable error diagnostic without related locations.
     * @param code - Stable compiler diagnostic identity.
     * @param message - Concise deterministic failure message.
     * @param start - Inclusive primary source offset.
     * @param end - Exclusive primary source offset.
     * @returns The immutable compiler diagnostic.
     */
    public create(
        code: CompilerDiagnosticCodeType,
        message: string,
        start: number,
        end: number,
    ): CompilerDiagnostic {
        return Object.freeze({
            code,
            severity: "error",
            message,
            filename: this.#filename,
            span: this.#locator.span(start, end),
            related: Object.freeze([]),
        });
    }
}
