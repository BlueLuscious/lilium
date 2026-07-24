/** @description Deterministic source-map version 3 payload for one generated Lily module. */
export interface CompilerSourceMap {
    /** @description Fixed source-map format version. */
    readonly version: 3;

    /** @description Normalized generated module identity. */
    readonly file: string;

    /** @description Ordered normalized Lily source identities represented by mappings. */
    readonly sources: readonly string[];

    /** @description Exact original source text corresponding to each source identity. */
    readonly sourcesContent: readonly string[];

    /** @description Ordered generated or source names referenced by mappings. */
    readonly names: readonly string[];

    /** @description Base64-VLQ encoded generated-to-source segment mappings. */
    readonly mappings: string;
}
