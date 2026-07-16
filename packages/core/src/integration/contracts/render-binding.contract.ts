/**
 * @description Identity-bearing public handle for one owned reactive render binding.
 * @remarks Dependency invalidation and execution remain internal to Core. Consumers may only
 * cancel the binding idempotently.
 */
export interface RenderBinding {
    /**
     * @description Cancels pending work and permanently disposes this render binding.
     * @remarks Disposal is idempotent. The binding cannot execute or track dependencies again.
     * @returns Nothing.
     */
    dispose(): void;
}
