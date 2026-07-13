import type { ISchedulerJob } from "./scheduler-job.contract.js";

/**
 * @description Internal deterministic scheduler for renderer bindings and user effects.
 * @remarks The scheduler owns phase queues, identity deduplication, reentry cycles,
 * and synchronous flushing without exposing queue collections.
 */
export interface IScheduler {
    /**
     * @description Removes a pending job from all scheduler cycles.
     * @remarks Cancellation is idempotent and has no effect on a running job.
     * @param job - Identity-bearing job to remove.
     * @returns Nothing.
     */
    cancel(job: ISchedulerJob): void;

    /**
     * @description Enqueues a job once in the earliest valid scheduler cycle.
     * @param job - Identity-bearing synchronous job to enqueue.
     * @returns Nothing.
     */
    enqueue(job: ISchedulerJob): void;

    /**
     * @description Synchronously drains pending work in deterministic phase order.
     * @remarks Calling flush during an active flush does not recurse; newly eligible
     * work follows the scheduler reentry rules.
     * @returns Nothing.
     */
    flush(): void;
}
