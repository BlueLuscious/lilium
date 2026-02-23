/**
 * @description Internal scheduler contract used by runtime to queue deferred work.
 * @remarks The scheduler accumulates tasks with {@link IScheduler.schedule schedule()} and
 * executes them when {@link IScheduler.flush flush()} is called.
 */
export interface IScheduler {
    /**
     * @description Enqueues a unit of work to be executed on the next flush.
     * @param task Callback representing scheduled work.
     */
    schedule(task: () => void): void;

    /**
     * @description Executes all currently queued tasks in scheduler order.
     * @remarks Tasks scheduled during a flush are handled by the scheduler implementation.
     */
    flush(): void;
}
