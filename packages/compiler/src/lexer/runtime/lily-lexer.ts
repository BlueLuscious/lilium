import type { CompilerDiagnostic } from "../../diagnostic/contracts/compiler-diagnostic.contract.js";
import { CompilerDiagnosticFactory } from "../../diagnostic/runtime/compiler-diagnostic.factory.js";
import { sortCompilerDiagnostics } from "../../diagnostic/runtime/sort-compiler-diagnostics.js";
import { CompilerSourceLocator } from "../../source/runtime/compiler-source-locator.js";
import type { ICompilerLexResult } from "../contracts/internal/compiler-lex-result.contract.js";
import type { ICompilerToken } from "../contracts/internal/compiler-token.contract.js";
import type { TCompilerTokenKind } from "../types/internal/compiler-token-kind.type.js";
import { lilyOperators } from "./lily-operators.js";
import { lilyPunctuators } from "./lily-punctuators.js";

/**
 * @description Deterministically tokenizes Lily source without semantic interpretation.
 * @remarks Comments remain tokens so later compiler stages can preserve exact source relationships.
 */
export class LilyLexer {
    /** @description Original caller-supplied source text. */
    readonly #source: string;

    /** @description Shared source offset mapper. */
    readonly #locator: CompilerSourceLocator;

    /** @description Factory for immutable lexical diagnostics. */
    readonly #diagnostics: CompilerDiagnosticFactory;

    /** @description Current UTF-16 source offset. */
    #offset = 0;

    /** @description Mutable token collection frozen when lexing completes. */
    readonly #tokens: ICompilerToken[] = [];

    /** @description Mutable lexical diagnostic collection sorted when lexing completes. */
    readonly #failures: CompilerDiagnostic[] = [];

    /**
     * @description Creates a lexer for one explicit Lily source.
     * @param source - Original caller-supplied source text.
     * @param filename - Explicit source identity used by diagnostics.
     */
    public constructor(source: string, filename: string) {
        this.#source = source;
        this.#locator = new CompilerSourceLocator(source);
        this.#diagnostics = new CompilerDiagnosticFactory(filename, this.#locator);
    }

    /**
     * @description Tokenizes the complete source exactly once.
     * @returns Immutable ordered tokens and lexical diagnostics.
     */
    public lex(): ICompilerLexResult {
        while (this.#offset < this.#source.length) {
            if (this.#consumeWhitespace()) {
                continue;
            }

            const start = this.#offset;
            const character = this.#source[this.#offset] ?? "";
            const next = this.#source[this.#offset + 1] ?? "";

            if (character === "/" && next === "/") {
                this.#scanLineComment(start);
            } else if (character === "/" && next === "*") {
                this.#scanBlockComment(start);
            } else if (character === "'" || character === '"') {
                this.#scanString(start, character);
            } else if (character === "`") {
                this.#scanTemplate(start);
            } else if (this.#isIdentifierStart(character)) {
                this.#scanIdentifier(start);
            } else if (this.#isDecimalDigit(character)) {
                this.#scanNumber(start);
            } else if (lilyPunctuators.includes(character)) {
                this.#offset += 1;
                this.#emit("punctuator", start, this.#offset);
            } else if (!this.#scanOperator(start)) {
                this.#offset += this.#codePointWidthAt(this.#offset);
                this.#emit("invalid", start, this.#offset);
                this.#failures.push(
                    this.#diagnostics.create(
                        "LILY1001",
                        `Unexpected source character '${this.#source.slice(start, this.#offset)}'.`,
                        start,
                        this.#offset,
                    ),
                );
            }
        }

        this.#emit("eof", this.#source.length, this.#source.length);

        return Object.freeze({
            tokens: Object.freeze([...this.#tokens]),
            diagnostics: sortCompilerDiagnostics(this.#failures),
        });
    }

    /**
     * @description Consumes source whitespace without emitting parser-visible tokens.
     * @returns Whether at least one whitespace code unit was consumed.
     */
    #consumeWhitespace(): boolean {
        const start = this.#offset;

        while (this.#offset < this.#source.length) {
            const character = this.#source[this.#offset] ?? "";

            if (!/\s/u.test(character)) {
                break;
            }
            this.#offset += 1;
        }

        return this.#offset > start;
    }

    /**
     * @description Scans one ECMAScript-style line comment.
     * @param start - Inclusive comment start offset.
     * @returns Nothing.
     */
    #scanLineComment(start: number): void {
        this.#offset += 2;

        while (this.#offset < this.#source.length) {
            const character = this.#source[this.#offset];

            if (character === "\r" || character === "\n") {
                break;
            }
            this.#offset += 1;
        }

        this.#emit("line-comment", start, this.#offset);
    }

    /**
     * @description Scans one ECMAScript-style block comment and diagnoses missing termination.
     * @param start - Inclusive comment start offset.
     * @returns Nothing.
     */
    #scanBlockComment(start: number): void {
        this.#offset += 2;

        while (
            this.#offset < this.#source.length &&
            !(this.#source[this.#offset] === "*" && this.#source[this.#offset + 1] === "/")
        ) {
            this.#offset += 1;
        }

        if (this.#offset >= this.#source.length) {
            this.#emit("block-comment", start, this.#offset);
            this.#failures.push(
                this.#diagnostics.create(
                    "LILY1002",
                    "Unterminated block comment.",
                    start,
                    this.#offset,
                ),
            );
            return;
        }

        this.#offset += 2;
        this.#emit("block-comment", start, this.#offset);
    }

    /**
     * @description Scans one quoted string literal and diagnoses line or source termination.
     * @param start - Inclusive string start offset.
     * @param quote - Opening quote character.
     * @returns Nothing.
     */
    #scanString(start: number, quote: string): void {
        this.#offset += 1;
        let terminated = false;

        while (this.#offset < this.#source.length) {
            const character = this.#source[this.#offset] ?? "";

            if (character === "\\") {
                this.#offset += Math.min(2, this.#source.length - this.#offset);
            } else if (character === quote) {
                this.#offset += 1;
                terminated = true;
                break;
            } else if (character === "\r" || character === "\n") {
                break;
            } else {
                this.#offset += this.#codePointWidthAt(this.#offset);
            }
        }

        this.#emit("string", start, this.#offset);

        if (!terminated) {
            this.#failures.push(
                this.#diagnostics.create(
                    "LILY1003",
                    "Unterminated string literal.",
                    start,
                    this.#offset,
                ),
            );
        }
    }

    /**
     * @description Scans one complete template literal including balanced substitutions.
     * @param start - Inclusive template start offset.
     * @returns Nothing.
     */
    #scanTemplate(start: number): void {
        this.#offset += 1;
        const terminated = this.#scanTemplateBody();
        this.#emit("template", start, this.#offset);

        if (!terminated) {
            this.#failures.push(
                this.#diagnostics.create(
                    "LILY1003",
                    "Unterminated template literal.",
                    start,
                    this.#offset,
                ),
            );
        }
    }

    /**
     * @description Advances through template text and recursively balanced substitution bodies.
     * @returns Whether a closing backtick terminated the template.
     */
    #scanTemplateBody(): boolean {
        while (this.#offset < this.#source.length) {
            const character = this.#source[this.#offset] ?? "";

            if (character === "\\") {
                this.#offset += Math.min(2, this.#source.length - this.#offset);
            } else if (character === "`") {
                this.#offset += 1;
                return true;
            } else if (character === "$" && this.#source[this.#offset + 1] === "{") {
                this.#offset += 2;
                if (!this.#scanTemplateSubstitution()) {
                    return false;
                }
            } else {
                this.#offset += this.#codePointWidthAt(this.#offset);
            }
        }

        return false;
    }

    /**
     * @description Scans one balanced template substitution without tokenizing its expression.
     * @returns Whether the matching substitution brace was found.
     */
    #scanTemplateSubstitution(): boolean {
        let depth = 1;

        while (this.#offset < this.#source.length) {
            const character = this.#source[this.#offset] ?? "";
            const next = this.#source[this.#offset + 1] ?? "";

            if (character === "'" || character === '"') {
                this.#skipQuotedText(character);
            } else if (character === "`") {
                this.#offset += 1;
                if (!this.#scanTemplateBody()) {
                    return false;
                }
            } else if (character === "/" && next === "/") {
                this.#skipLineComment();
            } else if (character === "/" && next === "*") {
                if (!this.#skipBlockComment()) {
                    return false;
                }
            } else if (character === "{") {
                depth += 1;
                this.#offset += 1;
            } else if (character === "}") {
                depth -= 1;
                this.#offset += 1;

                if (depth === 0) {
                    return true;
                }
            } else {
                this.#offset += this.#codePointWidthAt(this.#offset);
            }
        }

        return false;
    }

    /**
     * @description Skips quoted text while balancing a template substitution.
     * @param quote - Opening quote character.
     * @returns Nothing.
     */
    #skipQuotedText(quote: string): void {
        this.#offset += 1;

        while (this.#offset < this.#source.length) {
            const character = this.#source[this.#offset] ?? "";

            if (character === "\\") {
                this.#offset += Math.min(2, this.#source.length - this.#offset);
            } else {
                this.#offset += this.#codePointWidthAt(this.#offset);
                if (character === quote) {
                    return;
                }
                if (character === "\r" || character === "\n") {
                    return;
                }
            }
        }
    }

    /**
     * @description Skips a line comment inside a template substitution.
     * @returns Nothing.
     */
    #skipLineComment(): void {
        this.#offset += 2;

        while (this.#offset < this.#source.length) {
            const character = this.#source[this.#offset];

            if (character === "\r" || character === "\n") {
                return;
            }
            this.#offset += 1;
        }
    }

    /**
     * @description Skips a block comment inside a template substitution.
     * @returns Whether the comment was terminated.
     */
    #skipBlockComment(): boolean {
        this.#offset += 2;

        while (this.#offset < this.#source.length) {
            if (this.#source[this.#offset] === "*" && this.#source[this.#offset + 1] === "/") {
                this.#offset += 2;
                return true;
            }
            this.#offset += 1;
        }

        return false;
    }

    /**
     * @description Scans one Unicode identifier.
     * @param start - Inclusive identifier start offset.
     * @returns Nothing.
     */
    #scanIdentifier(start: number): void {
        this.#offset += this.#codePointWidthAt(this.#offset);

        while (this.#offset < this.#source.length) {
            const character = this.#codePointAt(this.#offset);

            if (!this.#isIdentifierContinue(character)) {
                break;
            }
            this.#offset += character.length;
        }

        this.#emit("identifier", start, this.#offset);
    }

    /**
     * @description Scans a decimal numeric token without assigning literal semantics.
     * @param start - Inclusive numeric start offset.
     * @returns Nothing.
     */
    #scanNumber(start: number): void {
        while (this.#isDecimalDigit(this.#source[this.#offset] ?? "")) {
            this.#offset += 1;
        }

        if (
            this.#source[this.#offset] === "." &&
            this.#isDecimalDigit(this.#source[this.#offset + 1] ?? "")
        ) {
            this.#offset += 1;
            while (this.#isDecimalDigit(this.#source[this.#offset] ?? "")) {
                this.#offset += 1;
            }
        }

        const exponent = this.#source[this.#offset];
        if (exponent === "e" || exponent === "E") {
            const exponentStart = this.#offset;
            this.#offset += 1;

            if (this.#source[this.#offset] === "+" || this.#source[this.#offset] === "-") {
                this.#offset += 1;
            }

            if (!this.#isDecimalDigit(this.#source[this.#offset] ?? "")) {
                this.#offset = exponentStart;
            } else {
                while (this.#isDecimalDigit(this.#source[this.#offset] ?? "")) {
                    this.#offset += 1;
                }
            }
        }

        this.#emit("number", start, this.#offset);
    }

    /**
     * @description Matches and emits one operator using longest-first precedence.
     * @param start - Candidate operator start offset.
     * @returns Whether an operator was emitted.
     */
    #scanOperator(start: number): boolean {
        const operator = lilyOperators.find((candidate) =>
            this.#source.startsWith(candidate, start),
        );

        if (operator === undefined) {
            return false;
        }

        this.#offset += operator.length;
        this.#emit("operator", start, this.#offset);
        return true;
    }

    /**
     * @description Emits one immutable token covering an exact source range.
     * @param kind - Stable lexical category.
     * @param start - Inclusive source offset.
     * @param end - Exclusive source offset.
     * @returns Nothing.
     */
    #emit(kind: TCompilerTokenKind, start: number, end: number): void {
        this.#tokens.push(
            Object.freeze({
                kind,
                lexeme: this.#source.slice(start, end),
                span: this.#locator.span(start, end),
            }),
        );
    }

    /**
     * @description Reads one complete Unicode code point at a UTF-16 offset.
     * @param offset - UTF-16 source offset.
     * @returns The complete code-point string or an empty string at EOF.
     */
    #codePointAt(offset: number): string {
        const value = this.#source.codePointAt(offset);
        return value === undefined ? "" : String.fromCodePoint(value);
    }

    /**
     * @description Computes the UTF-16 width of one source code point.
     * @param offset - UTF-16 source offset.
     * @returns One or two code units.
     */
    #codePointWidthAt(offset: number): number {
        return this.#codePointAt(offset).length || 1;
    }

    /**
     * @description Determines whether a character may start a JavaScript-compatible identifier.
     * @param character - Complete Unicode code point.
     * @returns Whether the character is accepted at identifier start.
     */
    #isIdentifierStart(character: string): boolean {
        return character === "$" || character === "_" || /^\p{ID_Start}$/u.test(character);
    }

    /**
     * @description Determines whether a character may continue a JavaScript-compatible identifier.
     * @param character - Complete Unicode code point.
     * @returns Whether the character is accepted after identifier start.
     */
    #isIdentifierContinue(character: string): boolean {
        return (
            character === "$" ||
            character === "_" ||
            character === "\u200c" ||
            character === "\u200d" ||
            /^\p{ID_Continue}$/u.test(character)
        );
    }

    /**
     * @description Determines whether one character is an ASCII decimal digit.
     * @param character - Candidate source character.
     * @returns Whether the character belongs to zero through nine.
     */
    #isDecimalDigit(character: string): boolean {
        return character >= "0" && character <= "9";
    }
}
