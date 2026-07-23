/** @description Collects independent terminal cleanup failures in deterministic execution order. */
export class RendererCleanupCollector {
    /** @description Flattened cleanup failures retained in the order they were observed. */
    readonly #errors: unknown[] = [];

    /**
     * @description Attempts one cleanup operation without preventing later cleanup work.
     * @param operation - Synchronous terminal operation to attempt exactly once.
     * @returns Nothing after success or failure collection.
     */
    attempt(operation: () => void): void {
        try {
            operation();
        } catch (error) {
            this.add(error);
        }
    }

    /**
     * @description Adds one failure while preserving nested aggregate execution order.
     * @param error - Cleanup failure or aggregate produced by a nested lifecycle.
     * @returns Nothing after the failure is recorded.
     */
    add(error: unknown): void {
        if (error instanceof AggregateError) {
            for (const nested of error.errors) {
                this.add(nested);
            }

            return;
        }

        this.#errors.push(error);
    }

    /**
     * @description Throws the collected result without wrapping a single original failure.
     * @param message - Aggregate message used only when multiple failures were collected.
     * @returns Nothing when no failure was collected.
     */
    throwIfAny(message: string): void {
        if (this.#errors.length === 1) {
            throw this.#errors[0];
        }

        if (this.#errors.length > 1) {
            throw new AggregateError(this.#errors, message);
        }
    }
}
