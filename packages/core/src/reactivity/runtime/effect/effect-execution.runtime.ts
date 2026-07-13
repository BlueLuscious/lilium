import type { EffectExecution } from "../../contracts/effect/effect-execution.contract.js";
import type { EffectCleanupType } from "../../types/effect/effect-cleanup.type.js";

/**
 * @description Internal execution-scoped collector for candidate effect cleanups.
 * @remarks Closing the collector permanently rejects later registration and transfers
 * its current cleanup ledger to the owning effect exactly once.
 */
export class EffectExecutionRuntime implements EffectExecution {
    /** @description Candidate cleanups in their original registration order. */
    readonly #cleanups: EffectCleanupType[] = [];

    /** @description Whether the effect callback may still register candidate cleanups. */
    #active = true;

    /**
     * @description Registers a cleanup while the associated callback remains active.
     * @param cleanup - Synchronous cleanup owned by this execution attempt.
     * @returns Nothing.
     */
    cleanup(cleanup: EffectCleanupType): void {
        if (!this.#active) {
            throw new Error("Cannot register cleanup outside an active effect execution.");
        }

        this.#cleanups.push(cleanup);
    }

    /**
     * @description Closes registration and transfers every candidate cleanup once.
     * @returns Candidate cleanups in their original registration order.
     */
    close(): EffectCleanupType[] {
        if (!this.#active) {
            return [];
        }

        this.#active = false;
        return this.#cleanups.splice(0);
    }
}
