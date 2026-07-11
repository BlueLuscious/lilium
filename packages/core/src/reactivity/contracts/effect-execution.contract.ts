import type { EffectCleanupType } from "../types/effect-cleanup.type.js";

/**
 * @description Execution-scoped object used to register effect cleanup operations.
 * @remarks The object is valid only while its effect callback is executing and must
 * not be retained for later cleanup registration.
 */
export interface EffectExecution {
    /**
     * @description Registers a synchronous cleanup for the current effect execution.
     * @param cleanup - Cleanup operation to run before reevaluation or during disposal.
     * @returns Nothing.
     */
    cleanup(cleanup: EffectCleanupType): void;
}
