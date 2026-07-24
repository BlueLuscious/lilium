/**
 * @description Rewrites validated binding roots into generated template-state access.
 * @remarks Strings, comments, template text, member names, and object keys remain unchanged.
 */
export class LilyBindingEmitter {
    /** @description Exact validated binding source. */
    readonly #source: string;

    /** @description Current UTF-16 source offset. */
    #offset = 0;

    /**
     * @description Creates an emitter for one validated binding expression.
     * @param source - Exact validated binding source.
     */
    public constructor(source: string) {
        this.#source = source;
    }

    /**
     * @description Emits normalized LF binding source rooted at generated `$state`.
     * @returns Deterministic generated binding expression.
     */
    public emit(): string {
        return this.#emitCode(false).replace(/\r\n?|\n/g, "\n");
    }

    /**
     * @description Emits code until EOF or a substitution-closing brace.
     * @param stopAtClosingBrace - Whether an unmatched closing brace ends this invocation.
     * @returns Rewritten code segment.
     */
    #emitCode(stopAtClosingBrace: boolean): string {
        let output = "";
        let braceDepth = 0;

        while (this.#offset < this.#source.length) {
            const character = this.#source[this.#offset] ?? "";
            const next = this.#source[this.#offset + 1] ?? "";

            if (character === "}" && stopAtClosingBrace && braceDepth === 0) {
                break;
            }
            if (character === "'" || character === '"') {
                output += this.#copyQuoted(character);
            } else if (character === "`") {
                output += this.#emitTemplate();
            } else if (character === "/" && next === "/") {
                output += this.#copyLineComment();
            } else if (character === "/" && next === "*") {
                output += this.#copyBlockComment();
            } else if (this.#isIdentifierStart(this.#codePointAt(this.#offset))) {
                output += this.#emitIdentifier();
            } else {
                if (character === "{") {
                    braceDepth += 1;
                } else if (character === "}" && braceDepth > 0) {
                    braceDepth -= 1;
                }
                output += character;
                this.#offset += 1;
            }
        }

        return output;
    }

    /**
     * @description Emits one template literal and recursively rewrites its substitutions.
     * @returns Complete generated template literal.
     */
    #emitTemplate(): string {
        let output = "`";
        this.#offset += 1;

        while (this.#offset < this.#source.length) {
            const character = this.#source[this.#offset] ?? "";

            if (character === "\\") {
                output += this.#source.slice(this.#offset, this.#offset + 2);
                this.#offset += 2;
            } else if (character === "`") {
                output += "`";
                this.#offset += 1;
                break;
            } else if (character === "$" && this.#source[this.#offset + 1] === "{") {
                output += "${";
                this.#offset += 2;
                output += this.#emitCode(true);
                if (this.#source[this.#offset] === "}") {
                    output += "}";
                    this.#offset += 1;
                }
            } else {
                output += character;
                this.#offset += 1;
            }
        }

        return output;
    }

    /**
     * @description Emits one identifier with generated state qualification when required.
     * @returns Original or state-qualified identifier.
     */
    #emitIdentifier(): string {
        const start = this.#offset;
        this.#offset += this.#codePointAt(this.#offset).length;

        while (
            this.#offset < this.#source.length &&
            this.#isIdentifierContinue(this.#codePointAt(this.#offset))
        ) {
            this.#offset += this.#codePointAt(this.#offset).length;
        }

        const identifier = this.#source.slice(start, this.#offset);
        const previous = this.#previousSignificant(start);
        const next = this.#nextSignificant(this.#offset);
        const objectKey = next === ":" && (previous === "{" || previous === ",");
        const memberName = previous === ".";

        return ["inputs", "controller"].includes(identifier) && !objectKey && !memberName
            ? `$state.${identifier}`
            : identifier;
    }

    /**
     * @description Copies one quoted string without rewriting its contents.
     * @param quote - Opening quote character.
     * @returns Complete quoted source segment.
     */
    #copyQuoted(quote: string): string {
        const start = this.#offset;
        this.#offset += 1;

        while (this.#offset < this.#source.length) {
            const character = this.#source[this.#offset] ?? "";
            this.#offset += 1;

            if (character === "\\") {
                this.#offset += 1;
            } else if (character === quote) {
                break;
            }
        }

        return this.#source.slice(start, this.#offset);
    }

    /**
     * @description Copies one line comment without rewriting its contents.
     * @returns Complete line comment segment.
     */
    #copyLineComment(): string {
        const start = this.#offset;
        this.#offset += 2;

        while (
            this.#offset < this.#source.length &&
            !["\r", "\n"].includes(this.#source[this.#offset] ?? "")
        ) {
            this.#offset += 1;
        }

        return this.#source.slice(start, this.#offset);
    }

    /**
     * @description Copies one terminated block comment without rewriting its contents.
     * @returns Complete block comment segment.
     */
    #copyBlockComment(): string {
        const start = this.#offset;
        this.#offset += 2;

        while (
            this.#offset < this.#source.length &&
            !(this.#source[this.#offset] === "*" && this.#source[this.#offset + 1] === "/")
        ) {
            this.#offset += 1;
        }
        this.#offset = Math.min(this.#source.length, this.#offset + 2);
        return this.#source.slice(start, this.#offset);
    }

    /**
     * @description Finds the prior non-whitespace source character.
     * @param offset - Exclusive backward search offset.
     * @returns Prior significant character or an empty string.
     */
    #previousSignificant(offset: number): string {
        for (let index = offset - 1; index >= 0; index -= 1) {
            const character = this.#source[index] ?? "";
            if (!/\s/u.test(character)) {
                return character;
            }
        }
        return "";
    }

    /**
     * @description Finds the next non-whitespace source character.
     * @param offset - Inclusive forward search offset.
     * @returns Next significant character or an empty string.
     */
    #nextSignificant(offset: number): string {
        for (let index = offset; index < this.#source.length; index += 1) {
            const character = this.#source[index] ?? "";
            if (!/\s/u.test(character)) {
                return character;
            }
        }
        return "";
    }

    /**
     * @description Reads one complete Unicode code point.
     * @param offset - UTF-16 source offset.
     * @returns Complete code-point string or an empty string at EOF.
     */
    #codePointAt(offset: number): string {
        const value = this.#source.codePointAt(offset);
        return value === undefined ? "" : String.fromCodePoint(value);
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
}
