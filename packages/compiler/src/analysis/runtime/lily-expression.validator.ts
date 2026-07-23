import type { CompilerDiagnostic } from "../../diagnostic/contracts/compiler-diagnostic.contract.js";
import type { CompilerDiagnosticFactory } from "../../diagnostic/runtime/compiler-diagnostic.factory.js";
import type { CompilerDiagnosticCodeType } from "../../diagnostic/types/compiler-diagnostic-code.type.js";
import type { ICompilerToken } from "../../lexer/contracts/internal/compiler-token.contract.js";
import { LilyLexer } from "../../lexer/runtime/lily-lexer.js";
import type { TCompilerPropertyKind } from "../../parser/types/internal/compiler-property-kind.type.js";
import { lilyBindingOperatorPrecedence } from "./lily-binding-operator-precedence.js";

/**
 * @description Validates one isolated static or binding expression without evaluating source code.
 */
export class LilyExpressionValidator {
    /** @description Original file offset corresponding to expression offset zero. */
    readonly #baseOffset: number;

    /** @description Property mode selecting accepted expression capabilities. */
    readonly #kind: TCompilerPropertyKind;

    /** @description Explicit source identity used by nested expression lexing. */
    readonly #filename: string;

    /** @description Factory mapping local failures back to complete source offsets. */
    readonly #diagnostics: CompilerDiagnosticFactory;

    /** @description Significant expression tokens including terminal EOF. */
    readonly #tokens: readonly ICompilerToken[];

    /** @description Mutable semantic failures frozen after validation. */
    readonly #failures: CompilerDiagnostic[] = [];

    /** @description Current significant expression token index. */
    #index = 0;

    /**
     * @description Creates a validator for one exact expression range.
     * @param source - Exact expression source spelling.
     * @param baseOffset - Original file offset corresponding to expression offset zero.
     * @param kind - Static value or reactive binding mode.
     * @param filename - Explicit source identity used by nested lexical diagnostics.
     * @param diagnostics - Complete-source diagnostic factory.
     */
    public constructor(
        source: string,
        baseOffset: number,
        kind: TCompilerPropertyKind,
        filename: string,
        diagnostics: CompilerDiagnosticFactory,
    ) {
        this.#baseOffset = baseOffset;
        this.#kind = kind;
        this.#filename = filename;
        this.#diagnostics = diagnostics;

        const lexical = new LilyLexer(source, filename).lex();
        this.#tokens = Object.freeze(
            lexical.tokens.filter(
                (token) => token.kind !== "line-comment" && token.kind !== "block-comment",
            ),
        );

        for (const failure of lexical.diagnostics) {
            this.#failures.push(
                this.#diagnostics.create(
                    failure.code,
                    failure.message,
                    this.#absolute(failure.span.start.offset),
                    this.#absolute(failure.span.end.offset),
                ),
            );
        }
    }

    /**
     * @description Validates the complete expression and rejects trailing unsupported syntax.
     * @returns Immutable semantic expression diagnostics.
     */
    public validate(): readonly CompilerDiagnostic[] {
        if (this.#failures.length === 0) {
            const arrow = this.#tokens.find((token) => token.lexeme === "=>");
            const typescript = this.#tokens.find((token) =>
                ["as", "satisfies"].includes(token.lexeme),
            );

            if (arrow !== undefined) {
                this.#report(
                    "LILY3008",
                    "Inline callback expressions are not supported by the first compiler milestone.",
                    arrow,
                );
            } else if (typescript !== undefined) {
                this.#report(
                    "LILY3003",
                    "TypeScript expression syntax is not supported in Lily source.",
                    typescript,
                );
            } else if (this.#kind === "value") {
                this.#parseLiteral();
            } else {
                this.#parseBinding(0);
            }

            if (!this.#atEnd() && this.#failures.length === 0) {
                this.#reportTrailingSyntax();
            }
        }

        return Object.freeze([...this.#failures]);
    }

    /**
     * @description Parses one recursively immutable static literal expression.
     * @returns Whether one complete literal primary was consumed.
     */
    #parseLiteral(): boolean {
        const token = this.#current();

        if ((token.lexeme === "+" || token.lexeme === "-") && this.#peek().kind === "number") {
            this.#advance();
            this.#advance();
            return true;
        }
        if (token.kind === "string" || token.kind === "number") {
            this.#advance();
            return true;
        }
        if (token.kind === "template") {
            this.#advance();
            if (token.lexeme.includes("${")) {
                this.#report(
                    "LILY1007",
                    "Static template literals cannot contain substitutions.",
                    token,
                );
                return false;
            }
            return true;
        }
        if (token.kind === "identifier" && ["true", "false", "null"].includes(token.lexeme)) {
            this.#advance();
            return true;
        }
        if (token.lexeme === "[") {
            return this.#parseArray("value");
        }
        if (token.lexeme === "{") {
            return this.#parseObject("value");
        }

        this.#report("LILY1007", "Expected an immutable static literal expression.", token);
        return false;
    }

    /**
     * @description Parses one precedence-aware binding expression.
     * @param minimumPrecedence - Lowest binary precedence accepted by this invocation.
     * @returns Whether one binding expression was consumed.
     */
    #parseBinding(minimumPrecedence: number): boolean {
        if (!this.#parseBindingUnary()) {
            return false;
        }

        while (!this.#atEnd()) {
            const token = this.#current();
            const precedence = lilyBindingOperatorPrecedence[token.lexeme];

            if (precedence === undefined || precedence < minimumPrecedence) {
                break;
            }

            this.#advance();
            const rightPrecedence = token.lexeme === "**" ? precedence : precedence + 1;
            if (!this.#parseBinding(rightPrecedence)) {
                return false;
            }
        }

        if (minimumPrecedence === 0 && this.#current().lexeme === "?") {
            this.#advance();
            if (!this.#parseBinding(0)) {
                return false;
            }
            if (!this.#consume(":", "Expected ':' in conditional binding expression.")) {
                return false;
            }
            return this.#parseBinding(0);
        }

        return true;
    }

    /**
     * @description Parses accepted unary operators or delegates to a binding primary.
     * @returns Whether one unary or primary binding expression was consumed.
     */
    #parseBindingUnary(): boolean {
        const token = this.#current();

        if (["!", "+", "-", "~"].includes(token.lexeme)) {
            this.#advance();
            return this.#parseBindingUnary();
        }
        if (["await", "yield", "async", "resource"].includes(token.lexeme)) {
            this.#report(
                "LILY3009",
                "Async and resource expressions are not supported by the first compiler milestone.",
                token,
            );
            return false;
        }
        if (["function", "class"].includes(token.lexeme) || token.lexeme === "=>") {
            this.#report(
                "LILY3008",
                "Inline callback expressions are not supported by the first compiler milestone.",
                token,
            );
            return false;
        }
        if (token.lexeme === "new") {
            this.#report(
                "LILY3002",
                "Binding expressions cannot construct or invoke arbitrary values.",
                token,
            );
            return false;
        }

        return this.#parseBindingPrimary();
    }

    /**
     * @description Parses one accepted binding primary and its restricted member access.
     * @returns Whether one complete binding primary was consumed.
     */
    #parseBindingPrimary(): boolean {
        const token = this.#current();

        if (token.kind === "string" || token.kind === "number") {
            this.#advance();
            return true;
        }
        if (token.kind === "template") {
            this.#advance();
            return this.#validateTemplate(token);
        }
        if (token.kind === "identifier" && ["true", "false", "null"].includes(token.lexeme)) {
            this.#advance();
            return true;
        }
        if (token.lexeme === "[") {
            return this.#parseArray("bind");
        }
        if (token.lexeme === "{") {
            return this.#parseObject("bind");
        }
        if (token.lexeme === "(") {
            this.#advance();
            if (!this.#parseBinding(0)) {
                return false;
            }
            return this.#consume(")", "Expected ')' after binding expression.");
        }
        if (token.kind !== "identifier" || !["inputs", "controller"].includes(token.lexeme)) {
            if (token.kind === "identifier" && this.#peek().lexeme === "(") {
                this.#report(
                    "LILY3002",
                    "Binding expressions cannot invoke arbitrary functions.",
                    this.#peek(),
                );
                return false;
            }
            this.#report(
                "LILY1008",
                "Binding expressions may reference only 'inputs' or 'controller' roots.",
                token,
            );
            return false;
        }

        this.#advance();
        let lastMember = token.lexeme;

        while (this.#current().lexeme === ".") {
            this.#advance();
            const member = this.#current();
            if (member.kind !== "identifier") {
                this.#report("LILY1008", "Expected a property name after '.'.", member);
                return false;
            }
            lastMember = member.lexeme;
            this.#advance();
        }

        if (this.#current().lexeme === "(") {
            const call = this.#advance();

            if (lastMember !== "get" || this.#current().lexeme !== ")") {
                this.#report(
                    "LILY3002",
                    "Binding expressions cannot invoke component commands or arbitrary calls.",
                    call,
                );
                return false;
            }
            this.#advance();
        }

        return true;
    }

    /**
     * @description Parses one recursive array literal for the selected expression mode.
     * @param kind - Static or binding element mode.
     * @returns Whether the complete array was consumed.
     */
    #parseArray(kind: TCompilerPropertyKind): boolean {
        this.#advance();

        while (!this.#atEnd() && this.#current().lexeme !== "]") {
            if (this.#current().lexeme === "...") {
                this.#report("LILY1008", "Spread syntax is not supported.", this.#current());
                return false;
            }
            if (!(kind === "value" ? this.#parseLiteral() : this.#parseBinding(0))) {
                return false;
            }
            if (this.#current().lexeme !== ",") {
                break;
            }
            this.#advance();
        }

        return this.#consume("]", "Expected ']' after array literal.");
    }

    /**
     * @description Parses one recursive object literal for the selected expression mode.
     * @param kind - Static or binding property-value mode.
     * @returns Whether the complete object was consumed.
     */
    #parseObject(kind: TCompilerPropertyKind): boolean {
        this.#advance();

        while (!this.#atEnd() && this.#current().lexeme !== "}") {
            const key = this.#current();
            if (!["identifier", "string", "number"].includes(key.kind)) {
                this.#report(
                    kind === "value" ? "LILY1007" : "LILY1008",
                    "Expected an object literal property name.",
                    key,
                );
                return false;
            }
            this.#advance();
            if (!this.#consume(":", "Expected ':' after object literal property name.")) {
                return false;
            }
            if (!(kind === "value" ? this.#parseLiteral() : this.#parseBinding(0))) {
                return false;
            }
            if (this.#current().lexeme !== ",") {
                break;
            }
            this.#advance();
        }

        return this.#consume("}", "Expected '}' after object literal.");
    }

    /**
     * @description Validates every substitution contained by one binding template token.
     * @param token - Complete template literal token.
     * @returns Whether every substitution is a valid binding expression.
     */
    #validateTemplate(token: ICompilerToken): boolean {
        const raw = token.lexeme;
        let offset = 1;

        while (offset < raw.length - 1) {
            if (raw[offset] === "\\") {
                offset += 2;
                continue;
            }
            if (raw[offset] !== "$" || raw[offset + 1] !== "{") {
                offset += 1;
                continue;
            }

            const expressionStart = offset + 2;
            const expressionEnd = this.#findTemplateExpressionEnd(raw, expressionStart);
            if (expressionEnd < expressionStart) {
                return false;
            }

            const nested = new LilyExpressionValidator(
                raw.slice(expressionStart, expressionEnd),
                this.#absolute(token.span.start.offset + expressionStart),
                "bind",
                this.#filename,
                this.#diagnostics,
            ).validate();
            this.#failures.push(...nested);
            if (nested.length > 0) {
                return false;
            }
            offset = expressionEnd + 1;
        }

        return true;
    }

    /**
     * @description Finds the matching brace for one template substitution.
     * @param source - Complete raw template token.
     * @param start - First substitution expression offset.
     * @returns Matching brace offset, or minus one when absent.
     */
    #findTemplateExpressionEnd(source: string, start: number): number {
        let depth = 1;

        for (let offset = start; offset < source.length; offset += 1) {
            const character = source[offset];

            if (character === "\\") {
                offset += 1;
            } else if (character === "'" || character === '"' || character === "`") {
                offset = this.#skipQuoted(source, offset, character);
            } else if (character === "{") {
                depth += 1;
            } else if (character === "}") {
                depth -= 1;
                if (depth === 0) {
                    return offset;
                }
            }
        }

        return -1;
    }

    /**
     * @description Skips one quoted segment while locating a template substitution boundary.
     * @param source - Complete raw template token.
     * @param start - Opening quote offset.
     * @param quote - Opening quote character.
     * @returns Closing quote offset or final source offset.
     */
    #skipQuoted(source: string, start: number, quote: string): number {
        for (let offset = start + 1; offset < source.length; offset += 1) {
            if (source[offset] === "\\") {
                offset += 1;
            } else if (source[offset] === quote) {
                return offset;
            }
        }

        return source.length - 1;
    }

    /**
     * @description Reports trailing assignment, call, callback, or generic invalid syntax.
     * @returns Nothing.
     */
    #reportTrailingSyntax(): void {
        const token = this.#current();

        if (token.lexeme === "=>") {
            this.#report(
                "LILY3008",
                "Inline callback expressions are not supported by the first compiler milestone.",
                token,
            );
        } else if (token.lexeme === "(") {
            this.#report(
                "LILY3002",
                "Binding expressions cannot invoke component commands or arbitrary calls.",
                token,
            );
        } else {
            this.#report(
                this.#kind === "value" ? "LILY1007" : "LILY1008",
                `Unexpected expression token '${token.lexeme}'.`,
                token,
            );
        }
    }

    /**
     * @description Consumes one expected expression token or reports a mode-specific failure.
     * @param lexeme - Exact expected token spelling.
     * @param message - Deterministic failure message.
     * @returns Whether the token was consumed.
     */
    #consume(lexeme: string, message: string): boolean {
        if (this.#current().lexeme === lexeme) {
            this.#advance();
            return true;
        }

        this.#report(this.#kind === "value" ? "LILY1007" : "LILY1008", message, this.#current());
        return false;
    }

    /**
     * @description Creates one complete-source diagnostic from a local expression token.
     * @param code - Stable diagnostic identity.
     * @param message - Deterministic failure message.
     * @param token - Local token locating the failure.
     * @returns Nothing.
     */
    #report(code: CompilerDiagnosticCodeType, message: string, token: ICompilerToken): void {
        this.#failures.push(
            this.#diagnostics.create(
                code,
                message,
                this.#absolute(token.span.start.offset),
                this.#absolute(token.span.end.offset),
            ),
        );
    }

    /**
     * @description Maps one isolated expression offset into the complete source.
     * @param offset - Expression-local UTF-16 offset.
     * @returns Complete-source UTF-16 offset.
     */
    #absolute(offset: number): number {
        return this.#baseOffset + offset;
    }

    /**
     * @description Returns the current expression token.
     * @returns Current significant token including EOF.
     */
    #current(): ICompilerToken {
        const token = this.#tokens[this.#index] ?? this.#tokens[this.#tokens.length - 1];
        if (token === undefined) {
            throw new Error("Compiler lexer invariant violated: missing expression EOF token.");
        }
        return token;
    }

    /**
     * @description Returns one token after the current expression token without consuming it.
     * @returns Next significant token including EOF.
     */
    #peek(): ICompilerToken {
        return this.#tokens[this.#index + 1] ?? this.#current();
    }

    /**
     * @description Consumes and returns the current expression token.
     * @returns Consumed significant token.
     */
    #advance(): ICompilerToken {
        const token = this.#current();
        if (!this.#atEnd()) {
            this.#index += 1;
        }
        return token;
    }

    /**
     * @description Determines whether expression parsing reached EOF.
     * @returns Whether the current expression token is EOF.
     */
    #atEnd(): boolean {
        return this.#current().kind === "eof";
    }
}
