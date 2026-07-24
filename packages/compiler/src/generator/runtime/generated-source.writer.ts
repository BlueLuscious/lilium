import type { CompilerSourceSpan } from "../../source/contracts/compiler-source-span.contract.js";
import type { TCompilerGeneratedMapping } from "../../source-map/types/internal/compiler-generated-mapping.type.js";

/** @description Accumulates generated source text and ordered source mappings in one forward pass. */
export class GeneratedSourceWriter {
    /** @description Ordered generated source chunks. */
    readonly #chunks: string[] = [];

    /** @description Ordered generated-to-source mappings. */
    readonly #mappings: TCompilerGeneratedMapping[] = [];

    /** @description Current zero-based generated line. */
    #line = 0;

    /** @description Current zero-based generated UTF-16 column. */
    #column = 0;

    /**
     * @description Writes generated text without assigning an original source location.
     * @param text - Exact generated source text.
     * @returns Nothing.
     */
    public write(text: string): void {
        this.#chunks.push(text);

        for (const character of text) {
            if (character === "\n") {
                this.#line += 1;
                this.#column = 0;
            } else {
                this.#column += character.length;
            }
        }
    }

    /**
     * @description Writes generated text mapped from the start of one original source span.
     * @param text - Exact generated source text.
     * @param span - Original source range supplying the mapping start.
     * @returns Nothing.
     */
    public writeMapped(text: string, span: CompilerSourceSpan): void {
        const previous = this.#mappings.at(-1);

        if (previous?.generatedLine !== this.#line || previous.generatedColumn !== this.#column) {
            this.#mappings.push(
                Object.freeze({
                    generatedLine: this.#line,
                    generatedColumn: this.#column,
                    sourceLine: span.start.line - 1,
                    sourceColumn: span.start.column - 1,
                }),
            );
        }

        this.write(text);
    }

    /**
     * @description Returns the complete generated source accumulated so far.
     * @returns Complete generated source text.
     */
    public code(): string {
        return this.#chunks.join("");
    }

    /**
     * @description Returns an immutable snapshot of ordered generated-source mappings.
     * @returns Frozen generated mapping collection.
     */
    public mappings(): readonly TCompilerGeneratedMapping[] {
        return Object.freeze([...this.#mappings]);
    }

    /**
     * @description Returns the number of generated lines containing source before terminal EOF.
     * @returns Non-terminal generated line count.
     */
    public lineCount(): number {
        return this.#line;
    }
}
