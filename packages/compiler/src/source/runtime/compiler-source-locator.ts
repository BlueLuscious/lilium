import type { CompilerSourcePosition } from "../contracts/compiler-source-position.contract.js";
import type { CompilerSourceSpan } from "../contracts/compiler-source-span.contract.js";

/**
 * @description Maps UTF-16 source offsets to deterministic human-facing positions and spans.
 * @remarks CRLF is treated as one line break while offsets continue to address the original source.
 */
export class CompilerSourceLocator {
    /** @description Original caller-supplied source text addressed by this locator. */
    readonly #source: string;

    /** @description Ordered zero-based offsets where each source line starts. */
    readonly #lineStarts: readonly number[];

    /**
     * @description Creates a locator and indexes every normalized line boundary once.
     * @param source - Original caller-supplied Lily source.
     */
    public constructor(source: string) {
        this.#source = source;
        this.#lineStarts = Object.freeze(this.#collectLineStarts());
    }

    /**
     * @description Creates one immutable position for an original UTF-16 source offset.
     * @param offset - Zero-based UTF-16 source offset.
     * @returns The corresponding immutable one-based line and column position.
     */
    public position(offset: number): CompilerSourcePosition {
        if (!Number.isInteger(offset) || offset < 0 || offset > this.#source.length) {
            throw new RangeError("Compiler source offsets must address the supplied source.");
        }

        let low = 0;
        let high = this.#lineStarts.length - 1;

        while (low <= high) {
            const middle = Math.floor((low + high) / 2);
            const lineStart = this.#lineStarts[middle];

            if (lineStart === undefined || lineStart > offset) {
                high = middle - 1;
            } else {
                low = middle + 1;
            }
        }

        const lineIndex = Math.max(0, high);
        const lineStart = this.#lineStarts[lineIndex] ?? 0;

        return Object.freeze({
            offset,
            line: lineIndex + 1,
            column: offset - lineStart + 1,
        });
    }

    /**
     * @description Creates one immutable half-open span over the original source.
     * @param start - Inclusive zero-based UTF-16 start offset.
     * @param end - Exclusive zero-based UTF-16 end offset.
     * @returns The immutable source span.
     */
    public span(start: number, end: number): CompilerSourceSpan {
        if (end < start) {
            throw new RangeError("Compiler source spans cannot end before they start.");
        }

        return Object.freeze({
            start: this.position(start),
            end: this.position(end),
        });
    }

    /**
     * @description Collects line starts while treating CRLF as one logical break.
     * @returns Ordered source line start offsets.
     */
    #collectLineStarts(): number[] {
        const starts = [0];

        for (let offset = 0; offset < this.#source.length; offset += 1) {
            const character = this.#source[offset];

            if (character === "\r") {
                if (this.#source[offset + 1] === "\n") {
                    offset += 1;
                }
                starts.push(offset + 1);
            } else if (character === "\n") {
                starts.push(offset + 1);
            }
        }

        return starts;
    }
}
