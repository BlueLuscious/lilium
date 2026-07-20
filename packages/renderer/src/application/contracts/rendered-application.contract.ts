/**
 * @description Identity-bearing lifecycle handle for one mounted root application.
 * @remarks Nested occurrences remain private. Disposal is terminal and releases Renderer-owned
 * bindings, component attachments, host values, and the exclusive host session.
 */
export interface RenderedApplication {
    /** @description Whether this rendered root has entered its terminal disposed state. */
    readonly disposed: boolean;

    /**
     * @description Idempotently terminalizes and releases this complete rendered root.
     * @returns Nothing.
     */
    dispose(): void;
}
