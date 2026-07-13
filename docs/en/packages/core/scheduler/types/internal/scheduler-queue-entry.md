# `TSchedulerQueueEntry`

`TSchedulerQueueEntry` is the internal mutable record for one pending appearance of an [`ISchedulerJob`](../../contracts/internal/scheduler-job.md). It stores the job identity and whether that specific appearance was cancelled.

Separating an appearance from its job allows `cancel()` followed by `enqueue()` to create valid new work while stale array entries remain safely skippable. Queue entries never leave `SchedulerRuntime` and are not part of the public Core API.

See [Scheduler Runtime](../../runtime/index.md).
