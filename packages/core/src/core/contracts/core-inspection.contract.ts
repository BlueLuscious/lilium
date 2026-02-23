/**
 * @description Minimal diagnostic snapshot returned by `CoreInstance.inspect()`.
 * @remarks This shape is intentionally small and stable for tooling/debug views.
 */
export interface CoreInspection {
    /** @description Indicates whether a root component is currently mounted. */
    mounted: boolean;

    /** @description List of registered component identifiers. */
    components: string[];
}
