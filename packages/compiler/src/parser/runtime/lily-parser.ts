import type { CompilerDiagnostic } from "../../diagnostic/contracts/compiler-diagnostic.contract.js";
import { CompilerDiagnosticFactory } from "../../diagnostic/runtime/compiler-diagnostic.factory.js";
import { sortCompilerDiagnostics } from "../../diagnostic/runtime/sort-compiler-diagnostics.js";
import type { ICompilerToken } from "../../lexer/contracts/internal/compiler-token.contract.js";
import { LilyLexer } from "../../lexer/runtime/lily-lexer.js";
import { CompilerSourceLocator } from "../../source/runtime/compiler-source-locator.js";
import type { ICompilerExpressionSyntax } from "../contracts/internal/compiler-expression-syntax.contract.js";
import type { ICompilerFileSyntax } from "../contracts/internal/compiler-file-syntax.contract.js";
import type { ICompilerImportSyntax } from "../contracts/internal/compiler-import-syntax.contract.js";
import type { ICompilerNamedImportSyntax } from "../contracts/internal/compiler-named-import-syntax.contract.js";
import type { ICompilerNodeSyntax } from "../contracts/internal/compiler-node-syntax.contract.js";
import type { ICompilerParseResult } from "../contracts/internal/compiler-parse-result.contract.js";
import type { ICompilerPropertySyntax } from "../contracts/internal/compiler-property-syntax.contract.js";
import type { ICompilerStringSyntax } from "../contracts/internal/compiler-string-syntax.contract.js";
import type { ICompilerTemplateSyntax } from "../contracts/internal/compiler-template-syntax.contract.js";
import type { TCompilerImportKind } from "../types/internal/compiler-import-kind.type.js";
import type { TCompilerPropertyKind } from "../types/internal/compiler-property-kind.type.js";
import type { TCompilerTopLevelSyntax } from "../types/internal/compiler-top-level-syntax.type.js";
import { lilyNodeKeywords } from "./lily-node-keywords.js";
import { lilyTemplateKeywords } from "./lily-template-keywords.js";
import { lilyTopLevelKeywords } from "./lily-top-level-keywords.js";
import { lilyUnsupportedKeywords } from "./lily-unsupported-keywords.js";

/**
 * @description Parses accepted Lily structure into a recoverable source-located concrete syntax tree.
 * @remarks Semantic resolution and expression purity validation deliberately belong to analysis.
 */
export class LilyParser {
    /** @description Original caller-supplied source text. */
    readonly #source: string;

    /** @description Shared source offset mapper. */
    readonly #locator: CompilerSourceLocator;

    /** @description Factory for immutable parsing diagnostics. */
    readonly #diagnosticFactory: CompilerDiagnosticFactory;

    /** @description Non-comment lexer tokens consumed by structural parsing. */
    readonly #tokens: readonly ICompilerToken[];

    /** @description Lexer diagnostics retained in the final parse result. */
    readonly #lexicalDiagnostics: readonly CompilerDiagnostic[];

    /** @description Mutable parser diagnostics sorted when parsing completes. */
    readonly #parserDiagnostics: CompilerDiagnostic[] = [];

    /** @description Current significant token index. */
    #index = 0;

    /**
     * @description Creates a parser and deterministically lexes its explicit source.
     * @param source - Original caller-supplied Lily source.
     * @param filename - Explicit source identity used by diagnostics.
     */
    public constructor(source: string, filename: string) {
        this.#source = source;
        this.#locator = new CompilerSourceLocator(source);
        this.#diagnosticFactory = new CompilerDiagnosticFactory(filename, this.#locator);

        const lexical = new LilyLexer(source, filename).lex();
        this.#tokens = Object.freeze(
            lexical.tokens.filter(
                (token) => token.kind !== "line-comment" && token.kind !== "block-comment",
            ),
        );
        this.#lexicalDiagnostics = lexical.diagnostics;
    }

    /**
     * @description Parses the complete source while recovering at documented declaration boundaries.
     * @returns Immutable concrete syntax and deterministically ordered diagnostics.
     */
    public parse(): ICompilerParseResult {
        const declarations: TCompilerTopLevelSyntax[] = [];

        while (!this.#atEnd()) {
            const token = this.#current();

            if (this.#isImportKeyword(token.lexeme)) {
                const declaration = this.#parseImport(token.lexeme as TCompilerImportKind);
                if (declaration !== undefined) {
                    declarations.push(declaration);
                }
            } else if (token.lexeme === "template") {
                const declaration = this.#parseTemplate();
                if (declaration !== undefined) {
                    declarations.push(declaration);
                }
            } else {
                this.#reportUnsupportedOrUnexpected(token);
                this.#synchronizeTopLevel();
            }
        }

        const syntax: ICompilerFileSyntax = Object.freeze({
            kind: "file",
            declarations: Object.freeze(declarations),
            span: this.#locator.span(0, this.#source.length),
        });

        return Object.freeze({
            syntax,
            diagnostics: sortCompilerDiagnostics([
                ...this.#lexicalDiagnostics,
                ...this.#parserDiagnostics,
            ]),
        });
    }

    /**
     * @description Parses one behavior, primitives, or properties named import declaration.
     * @param importKind - Import category identified by the leading keyword.
     * @returns A recovered import declaration, or undefined when required structure is absent.
     */
    #parseImport(importKind: TCompilerImportKind): ICompilerImportSyntax | undefined {
        const start = this.#advance().span.start.offset;
        if (!this.#consumeLexeme("{", "Expected '{' after import category.")) {
            this.#synchronizeTopLevel();
            return undefined;
        }

        const names = this.#parseNamedList();
        if (!this.#consumeLexeme("from", "Expected 'from' after named import list.")) {
            this.#synchronizeTopLevel();
            return undefined;
        }

        const sourceToken = this.#current();
        if (sourceToken.kind !== "string") {
            this.#reportExpected(sourceToken, "Expected a string literal module specifier.");
            this.#synchronizeTopLevel();
            return undefined;
        }
        this.#advance();

        const source: ICompilerStringSyntax = Object.freeze({
            raw: sourceToken.lexeme,
            span: sourceToken.span,
        });
        const end = this.#consumeSemicolon("Expected ';' after import declaration.");

        return Object.freeze({
            kind: "import",
            importKind,
            names: Object.freeze(names),
            source,
            span: this.#locator.span(start, end),
        });
    }

    /**
     * @description Parses the contents and closing brace of one named import list.
     * @returns Ordered successfully parsed import names.
     */
    #parseNamedList(): ICompilerNamedImportSyntax[] {
        const names: ICompilerNamedImportSyntax[] = [];
        let expectName = true;

        if (this.#current().lexeme === "}") {
            this.#reportExpected(this.#current(), "Expected at least one named import.");
        }

        while (!this.#atEnd() && this.#current().lexeme !== "}") {
            const token = this.#current();

            if (expectName) {
                if (token.kind !== "identifier") {
                    this.#reportExpected(token, "Expected an identifier in named import list.");
                    this.#synchronizeNamedList();
                    expectName = this.#previous().lexeme === ",";
                    continue;
                }

                names.push(Object.freeze({ name: token.lexeme, span: token.span }));
                this.#advance();
                expectName = false;
            } else if (token.lexeme === ",") {
                this.#advance();
                expectName = true;
            } else {
                this.#reportExpected(token, "Expected ',' or '}' after named import.");
                this.#synchronizeNamedList();
                expectName = this.#previous().lexeme === ",";
            }
        }

        this.#consumeLexeme("}", "Expected '}' after named import list.");
        return names;
    }

    /**
     * @description Parses one top-level template block.
     * @returns A recovered template syntax node, or undefined when its block cannot begin.
     */
    #parseTemplate(): ICompilerTemplateSyntax | undefined {
        const start = this.#advance().span.start.offset;

        if (!this.#consumeLexeme("{", "Expected '{' after 'template'.")) {
            this.#synchronizeTopLevel();
            return undefined;
        }

        const declarations: ICompilerNodeSyntax[] = [];

        while (!this.#atEnd() && this.#current().lexeme !== "}") {
            if (this.#current().lexeme === "node") {
                const node = this.#parseNode();
                if (node !== undefined) {
                    declarations.push(node);
                }
            } else {
                this.#reportUnsupportedOrUnexpected(this.#current());
                this.#synchronizeBlock(lilyTemplateKeywords);
            }
        }

        const end = this.#consumeClosingBrace("Expected '}' after template block.");

        return Object.freeze({
            kind: "template",
            declarations: Object.freeze(declarations),
            span: this.#locator.span(start, end),
        });
    }

    /**
     * @description Parses one primitive node and its ordered property or child declarations.
     * @returns A recovered node syntax object, or undefined when required structure is absent.
     */
    #parseNode(): ICompilerNodeSyntax | undefined {
        const start = this.#advance().span.start.offset;
        const nameToken = this.#current();

        if (nameToken.kind !== "identifier") {
            this.#reportExpected(nameToken, "Expected a primitive identifier after 'node'.");
            this.#synchronizeBlock(lilyNodeKeywords);
            return undefined;
        }
        this.#advance();

        if (!this.#consumeLexeme("{", "Expected '{' after primitive identifier.")) {
            this.#synchronizeBlock(lilyNodeKeywords);
            return undefined;
        }

        const declarations: (ICompilerPropertySyntax | ICompilerNodeSyntax)[] = [];

        while (!this.#atEnd() && this.#current().lexeme !== "}") {
            const keyword = this.#current().lexeme;

            if (keyword === "node") {
                const node = this.#parseNode();
                if (node !== undefined) {
                    declarations.push(node);
                }
            } else if (keyword === "value" || keyword === "bind") {
                const property = this.#parseProperty(keyword);
                if (property !== undefined) {
                    declarations.push(property);
                }
            } else {
                this.#reportUnsupportedOrUnexpected(this.#current());
                this.#synchronizeBlock(lilyNodeKeywords);
            }
        }

        const end = this.#consumeClosingBrace(`Expected '}' after node '${nameToken.lexeme}'.`);

        return Object.freeze({
            kind: "node",
            name: nameToken.lexeme,
            nameSpan: nameToken.span,
            declarations: Object.freeze(declarations),
            span: this.#locator.span(start, end),
        });
    }

    /**
     * @description Parses one static value or reactive binding declaration.
     * @param propertyKind - Property declaration category.
     * @returns A recovered property syntax object, or undefined when required structure is absent.
     */
    #parseProperty(propertyKind: TCompilerPropertyKind): ICompilerPropertySyntax | undefined {
        const start = this.#advance().span.start.offset;
        const nameToken = this.#current();

        if (nameToken.kind !== "identifier") {
            this.#reportExpected(
                nameToken,
                `Expected a property identifier after '${propertyKind}'.`,
            );
            this.#synchronizeBlock(lilyNodeKeywords);
            return undefined;
        }
        this.#advance();

        if (!this.#consumeLexeme("=", `Expected '=' after property '${nameToken.lexeme}'.`)) {
            this.#synchronizeBlock(lilyNodeKeywords);
            return undefined;
        }

        const expression = this.#parseExpression(propertyKind);
        if (expression === undefined) {
            this.#synchronizeBlock(lilyNodeKeywords);
            return undefined;
        }

        const end = this.#consumeSemicolon(
            `Expected ';' after ${propertyKind === "value" ? "static property value" : "binding expression"}.`,
        );

        return Object.freeze({
            kind: "property",
            propertyKind,
            name: nameToken.lexeme,
            nameSpan: nameToken.span,
            expression,
            span: this.#locator.span(start, end),
        });
    }

    /**
     * @description Preserves one balanced expression range until its declaration semicolon.
     * @param propertyKind - Property category selecting the empty-expression diagnostic.
     * @returns Exact expression syntax, or undefined when no expression token exists.
     */
    #parseExpression(propertyKind: TCompilerPropertyKind): ICompilerExpressionSyntax | undefined {
        const first = this.#current();
        const code = propertyKind === "value" ? "LILY1007" : "LILY1008";

        if (first.lexeme === ";" || first.lexeme === "}" || first.kind === "eof") {
            this.#parserDiagnostics.push(
                this.#diagnosticFactory.create(
                    code,
                    propertyKind === "value"
                        ? "Expected a static literal expression."
                        : "Expected a binding expression.",
                    first.span.start.offset,
                    first.span.end.offset,
                ),
            );
            return undefined;
        }

        const start = first.span.start.offset;
        let end = start;
        const delimiters: string[] = [];

        while (!this.#atEnd()) {
            const token = this.#current();

            if (token.lexeme === ";" && delimiters.length === 0) {
                break;
            }
            if (token.lexeme === "}" && delimiters.length === 0) {
                break;
            }
            if (
                end > start &&
                delimiters.length === 0 &&
                (lilyNodeKeywords.includes(token.lexeme) ||
                    Object.hasOwn(lilyUnsupportedKeywords, token.lexeme)) &&
                this.#previous().lexeme !== "."
            ) {
                break;
            }

            if (token.lexeme === "(" || token.lexeme === "[" || token.lexeme === "{") {
                delimiters.push(token.lexeme);
            } else if (token.lexeme === ")" || token.lexeme === "]" || token.lexeme === "}") {
                const expected = token.lexeme === ")" ? "(" : token.lexeme === "]" ? "[" : "{";
                if (delimiters.at(-1) === expected) {
                    delimiters.pop();
                }
            }

            end = token.span.end.offset;
            this.#advance();
        }

        if (delimiters.length > 0) {
            const token = this.#current();
            this.#parserDiagnostics.push(
                this.#diagnosticFactory.create(
                    "LILY1005",
                    `Expected closing delimiter for '${delimiters.at(-1)}'.`,
                    token.span.start.offset,
                    token.span.end.offset,
                ),
            );
        }

        return Object.freeze({
            raw: this.#source.slice(start, end),
            span: this.#locator.span(start, end),
        });
    }

    /**
     * @description Consumes a required semicolon or records a missing-declaration terminator.
     * @param message - Declaration-specific deterministic diagnostic message.
     * @returns Exclusive end offset for the enclosing recovered declaration.
     */
    #consumeSemicolon(message: string): number {
        if (this.#current().lexeme === ";") {
            return this.#advance().span.end.offset;
        }

        const token = this.#current();
        this.#parserDiagnostics.push(
            this.#diagnosticFactory.create(
                "LILY1004",
                message,
                token.span.start.offset,
                token.span.end.offset,
            ),
        );
        return this.#previous().span.end.offset;
    }

    /**
     * @description Consumes one required closing brace and diagnoses source termination precisely.
     * @param message - Context-specific deterministic diagnostic message.
     * @returns Exclusive end offset for the enclosing recovered block.
     */
    #consumeClosingBrace(message: string): number {
        if (this.#current().lexeme === "}") {
            return this.#advance().span.end.offset;
        }

        const token = this.#current();
        this.#parserDiagnostics.push(
            this.#diagnosticFactory.create(
                token.kind === "eof" ? "LILY1009" : "LILY1005",
                message,
                token.span.start.offset,
                token.span.end.offset,
            ),
        );
        return this.#previous().span.end.offset;
    }

    /**
     * @description Consumes one required exact token or reports a parser expectation.
     * @param lexeme - Exact expected source spelling.
     * @param message - Context-specific deterministic diagnostic message.
     * @returns Whether the expected token was consumed.
     */
    #consumeLexeme(lexeme: string, message: string): boolean {
        if (this.#current().lexeme === lexeme) {
            this.#advance();
            return true;
        }

        this.#reportExpected(this.#current(), message);
        return false;
    }

    /**
     * @description Records a missing expected token with EOF-specific identity when applicable.
     * @param token - Current token locating the failed expectation.
     * @param message - Context-specific deterministic diagnostic message.
     * @returns Nothing.
     */
    #reportExpected(token: ICompilerToken, message: string): void {
        this.#parserDiagnostics.push(
            this.#diagnosticFactory.create(
                token.kind === "eof" ? "LILY1009" : "LILY1005",
                message,
                token.span.start.offset,
                token.span.end.offset,
            ),
        );
    }

    /**
     * @description Reports a dedicated unsupported feature or a generic unexpected declaration.
     * @param token - Leading token of the invalid declaration or sequence.
     * @returns Nothing.
     */
    #reportUnsupportedOrUnexpected(token: ICompilerToken): void {
        const unsupported = Object.hasOwn(lilyUnsupportedKeywords, token.lexeme)
            ? lilyUnsupportedKeywords[token.lexeme]
            : undefined;

        if (unsupported !== undefined) {
            this.#parserDiagnostics.push(
                this.#diagnosticFactory.create(
                    unsupported.code,
                    unsupported.message,
                    token.span.start.offset,
                    token.span.end.offset,
                ),
            );
            return;
        }

        const markup = token.lexeme === "<";
        this.#parserDiagnostics.push(
            this.#diagnosticFactory.create(
                markup ? "LILY3010" : "LILY1006",
                markup
                    ? "Markup syntax is not supported by the first compiler milestone."
                    : `Unexpected declaration or token '${token.lexeme}'.`,
                token.span.start.offset,
                token.span.end.offset,
            ),
        );
    }

    /**
     * @description Advances to the next top-level keyword after one malformed declaration.
     * @returns Nothing.
     */
    #synchronizeTopLevel(): void {
        while (!this.#atEnd()) {
            if (lilyTopLevelKeywords.includes(this.#current().lexeme)) {
                return;
            }
            this.#advance();
        }
    }

    /**
     * @description Advances to a comma or closing brace inside a malformed named list.
     * @returns Nothing.
     */
    #synchronizeNamedList(): void {
        while (!this.#atEnd()) {
            const lexeme = this.#current().lexeme;

            if (lexeme === ",") {
                this.#advance();
                return;
            }
            if (lexeme === "}") {
                return;
            }
            this.#advance();
        }
    }

    /**
     * @description Advances inside one block to a semicolon, closing brace, or accepted declaration keyword.
     * @param keywords - Declaration keywords accepted by the current block.
     * @returns Nothing.
     */
    #synchronizeBlock(keywords: readonly string[]): void {
        let braceDepth = 0;

        while (!this.#atEnd()) {
            const token = this.#current();

            if (braceDepth === 0 && (token.lexeme === "}" || keywords.includes(token.lexeme))) {
                return;
            }
            if (braceDepth === 0 && token.lexeme === ";") {
                this.#advance();
                return;
            }
            if (token.lexeme === "{") {
                braceDepth += 1;
            } else if (token.lexeme === "}" && braceDepth > 0) {
                braceDepth -= 1;
            }
            this.#advance();
        }
    }

    /**
     * @description Determines whether one lexeme begins an accepted import category.
     * @param lexeme - Candidate token spelling.
     * @returns Whether the lexeme is an import keyword.
     */
    #isImportKeyword(lexeme: string): lexeme is TCompilerImportKind {
        return lexeme === "behavior" || lexeme === "primitives" || lexeme === "properties";
    }

    /**
     * @description Returns the current significant token.
     * @returns Current token, including terminal EOF.
     */
    #current(): ICompilerToken {
        const token = this.#tokens[this.#index] ?? this.#tokens[this.#tokens.length - 1];

        if (token === undefined) {
            throw new Error("Compiler lexer invariant violated: missing EOF token.");
        }

        return token;
    }

    /**
     * @description Returns the most recently consumed token or the first token initially.
     * @returns Previous significant token.
     */
    #previous(): ICompilerToken {
        return this.#tokens[Math.max(0, this.#index - 1)] ?? this.#current();
    }

    /**
     * @description Consumes and returns the current significant token.
     * @returns Consumed token.
     */
    #advance(): ICompilerToken {
        const token = this.#current();
        if (!this.#atEnd()) {
            this.#index += 1;
        }
        return token;
    }

    /**
     * @description Determines whether parsing reached the terminal EOF token.
     * @returns Whether the current token is EOF.
     */
    #atEnd(): boolean {
        return this.#current().kind === "eof";
    }
}
