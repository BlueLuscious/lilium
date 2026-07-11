# `IScheduler`

`IScheduler` is the internal service that owns phase queues, identity deduplication, cancellation, reentry cycles, and synchronous flushing.

`enqueue()` places a job in the earliest phase and cycle allowed by current progression. `cancel()` removes pending work idempotently. `flush()` drains work without recursive flush calls.

Queue collections and cycle bookkeeping remain implementation details.

See [`ISchedulerJob`](scheduler-job.md) and [Phases and Cycles](../../phases.md).
