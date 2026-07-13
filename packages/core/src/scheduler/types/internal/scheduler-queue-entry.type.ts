import type { ISchedulerJob } from "../../contracts/internal/scheduler-job.contract.js";

/**
 * @description Internal cancellable queue entry for one scheduler job appearance.
 * @remarks Entries distinguish a cancelled appearance from a later enqueue of the same job.
 */
export type TSchedulerQueueEntry = {
    /** @description Whether this specific pending appearance has been cancelled. */
    cancelled: boolean;

    /** @description Identity-bearing synchronous job represented by this queue entry. */
    readonly job: ISchedulerJob;
};
