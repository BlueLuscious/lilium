import type { TCompilerGeneratedMapping } from "../types/internal/compiler-generated-mapping.type.js";
import { base64VlqCharacters } from "./base64-vlq-characters.js";

/**
 * @description Encodes ordered generated-source mappings into source-map version 3 Base64-VLQ.
 */
export class CompilerSourceMapEncoder {
    /** @description Previous encoded source index retained across generated lines. */
    #previousSource = 0;

    /** @description Previous encoded original source line retained across generated lines. */
    #previousSourceLine = 0;

    /** @description Previous encoded original source column retained across generated lines. */
    #previousSourceColumn = 0;

    /**
     * @description Encodes mappings grouped by generated line.
     * @param mappings - Ordered generated-to-source mappings.
     * @param generatedLineCount - Number of non-terminal generated lines represented by the code.
     * @returns Deterministic source-map mappings field.
     */
    public encode(
        mappings: readonly TCompilerGeneratedMapping[],
        generatedLineCount: number,
    ): string {
        const byLine = new Map<number, TCompilerGeneratedMapping[]>();

        for (const mapping of mappings) {
            const line = byLine.get(mapping.generatedLine) ?? [];
            line.push(mapping);
            byLine.set(mapping.generatedLine, line);
        }

        const lines: string[] = [];

        for (let generatedLine = 0; generatedLine < generatedLineCount; generatedLine += 1) {
            let previousGeneratedColumn = 0;
            const segments = (byLine.get(generatedLine) ?? []).map((mapping) => {
                const segment = [
                    this.#encodeValue(mapping.generatedColumn - previousGeneratedColumn),
                    this.#encodeValue(0 - this.#previousSource),
                    this.#encodeValue(mapping.sourceLine - this.#previousSourceLine),
                    this.#encodeValue(mapping.sourceColumn - this.#previousSourceColumn),
                ].join("");

                previousGeneratedColumn = mapping.generatedColumn;
                this.#previousSource = 0;
                this.#previousSourceLine = mapping.sourceLine;
                this.#previousSourceColumn = mapping.sourceColumn;
                return segment;
            });

            lines.push(segments.join(","));
        }

        return lines.join(";");
    }

    /**
     * @description Encodes one signed integer as a Base64-VLQ field.
     * @param value - Signed delta value.
     * @returns Base64-VLQ encoded field.
     */
    #encodeValue(value: number): string {
        let vlq = value < 0 ? -value * 2 + 1 : value * 2;
        let encoded = "";

        do {
            let digit = vlq % 32;
            vlq = Math.floor(vlq / 32);
            if (vlq > 0) {
                digit += 32;
            }
            encoded += base64VlqCharacters[digit] ?? "";
        } while (vlq > 0);

        return encoded;
    }
}
