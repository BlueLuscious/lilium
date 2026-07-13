import type { IScheduler } from "../../../scheduler/contracts/internal/scheduler.contract.js";
import type { BatchFunctionType } from "../../types/batching/batch-function.type.js";

/**
 * @description Internal coordinator for nested synchronous scheduling boundaries.
 * @remarks Writes remain immediate. Only scheduler flushing is deferred until the
 * outermost batch restores depth, including when the batch operation throws.
 */
export class BatchingManager {
    /** @description Number of currently nested synchronous batch operations. */
    #depth = 0;

    /** @description Scheduler drained when no active batch boundary remains. */
    readonly #scheduler: IScheduler;

    /**
     * @description Creates a batching coordinator for one runtime scheduler.
     * @param scheduler - Runtime-isolated scheduler controlled by this boundary manager.
     */
    constructor(scheduler: IScheduler) {
        this.#scheduler = scheduler;
    }

    /**
     * @description Executes an operation and flushes only after the outermost batch exits.
     * @param operation - Synchronous operation containing immediately applied writes.
     * @returns Nothing.
     */
    batch(operation: BatchFunctionType): void {
        this.#depth += 1;
        let operationError: unknown;
        let operationFailed = false;

        try {
            const result = operation();

            if (result !== undefined) {
                throw new TypeError("Batch operations must return undefined.");
            }
        } catch (error) {
            operationError = error;
            operationFailed = true;
        } finally {
            this.#depth -= 1;
        }

        let flushError: unknown;
        let flushFailed = false;

        if (this.#depth === 0) {
            try {
                this.#scheduler.flush();
            } catch (error) {
                flushError = error;
                flushFailed = true;
            }
        }

        if (operationFailed && flushFailed) {
            throw new AggregateError(
                [operationError, flushError],
                "A batch operation and its scheduled flush both failed.",
            );
        }

        if (operationFailed) {
            throw operationError;
        }

        if (flushFailed) {
            throw flushError;
        }
    }

    /**
     * @description Flushes scheduled work immediately when no batch boundary is active.
     * @returns Nothing.
     */
    requestFlush(): void {
        if (this.#depth === 0) {
            this.#scheduler.flush();
        }
    }
}
