/** @description One generated location mapped to one original Lily source location. */
export type TCompilerGeneratedMapping = Readonly<{
    /** @description Zero-based generated line. */
    generatedLine: number;

    /** @description Zero-based generated UTF-16 column. */
    generatedColumn: number;

    /** @description Zero-based original source line. */
    sourceLine: number;

    /** @description Zero-based original source UTF-16 column. */
    sourceColumn: number;
}>;
