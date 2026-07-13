import { OwnershipManager } from "../../../ownership/runtime/ownership.manager.js";
import { SchedulerRuntime } from "../../../scheduler/runtime/scheduler.runtime.js";
import type { IReactiveRuntimeContext } from "../../contracts/internal/tracking/reactive-runtime-context.contract.js";
import type { BatchFunctionType } from "../../types/batching/batch-function.type.js";
import { BatchingManager } from "../batching/batching.manager.js";
import { ReactiveTrackerRuntime } from "../reactive-tracker.runtime.js";

/**
 * @description Internal composition root for one isolated reactive runtime.
 * @remarks Public runtime instances delegate to this context without exposing its graph,
 * ownership manager, scheduler, or batching coordinator.
 */
export class ReactiveRuntimeContextRuntime implements IReactiveRuntimeContext {
    /** @description Dependency tracker isolated to this runtime composition. */
    readonly tracker = new ReactiveTrackerRuntime();

    /** @description Ownership root isolated to this runtime composition. */
    readonly ownership = new OwnershipManager(
        (operation) => this.tracker.untrack(operation),
    );

    /** @description Deterministic scheduler isolated to this runtime composition. */
    readonly scheduler = new SchedulerRuntime(this.ownership);

    /** @description Nested scheduling-boundary coordinator for this runtime. */
    readonly #batching = new BatchingManager(this.scheduler);

    /**
     * @description Executes one synchronous batching boundary on this runtime.
     * @param operation - Operation containing immediately applied reactive writes.
     * @returns Nothing.
     */
    batch(operation: BatchFunctionType): void {
        this.assertOpen("start a batch");
        this.#batching.batch(operation);
    }

    /**
     * @description Permanently releases the ownership tree and scheduler queues.
     * @remarks Scheduler release still occurs when ownership reports cleanup failures,
     * but not when disposal is rejected before the ownership tree is closed.
     * @returns Nothing.
     */
    dispose(): void {
        try {
            this.ownership.dispose();
        } finally {
            if (this.ownership.disposed) {
                this.scheduler.dispose();
            }
        }
    }

    /**
     * @description Flushes eligible scheduled work outside active batching boundaries.
     * @remarks Flush requests raised by cleanup during root disposal are ignored because
     * all pending appearances are released when disposal completes.
     * @returns Nothing.
     */
    requestFlush(): void {
        if (this.ownership.disposed || this.ownership.disposing) {
            return;
        }

        this.#batching.requestFlush();
    }

    /**
     * @description Verifies that this runtime can create or coordinate resources.
     * @param operation - Human-readable operation used in the state error.
     * @returns Nothing.
     */
    assertOpen(operation: string): void {
        if (this.ownership.disposed || this.ownership.disposing) {
            throw new Error(`Cannot ${operation} on a disposed reactive runtime.`);
        }
    }
}
