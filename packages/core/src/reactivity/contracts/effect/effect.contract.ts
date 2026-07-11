/**
 * @description Disposable object representing a tracked reactive side effect.
 * @remarks Effects execute through the runtime scheduler and cannot be run manually.
 * Disposing an effect cancels pending execution, disconnects dependencies, and runs
 * its registered cleanups.
 */
export interface Effect {
    /**
     * @description Permanently disposes this effect and its owned execution resources.
     * @remarks Repeated disposal is safe and has no additional effect.
     * @returns Nothing.
     */
    dispose(): void;
}
