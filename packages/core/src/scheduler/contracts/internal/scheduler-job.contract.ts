import type { TSchedulerPhase } from "../../types/internal/scheduler-phase.type.js";

/** @description Internal type-only identity for a scheduler job. */
export declare const SCHEDULER_JOB_BRAND: unique symbol;

/**
 * @description Internal identity-bearing unit of synchronous scheduled work.
 * @remarks Object identity is used for queue deduplication and cancellation.
 */
export interface ISchedulerJob {
    /** @description Type-only marker that distinguishes scheduler jobs structurally. */
    readonly [SCHEDULER_JOB_BRAND]: true;

    /** @description Scheduler phase in which this job must execute. */
    readonly phase: TSchedulerPhase;

    /**
     * @description Executes this job synchronously in its assigned phase.
     * @returns `undefined` after execution completes.
     */
    execute(): undefined;
}
