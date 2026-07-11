# `ISchedulerJob`

`ISchedulerJob` is an internal synchronous unit of work. Object identity provides deduplication and cancellation, while a type-only brand prevents unrelated structural objects from entering queues.

Every job declares one `TSchedulerPhase` and implements `execute()` returning `undefined`. Async jobs and arbitrary return values are outside scheduler semantics.

See [`IScheduler`](scheduler.md) and [`TSchedulerPhase`](../../types/internal/scheduler-phase.md).
