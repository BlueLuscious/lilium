# `TSchedulerPhase`

`TSchedulerPhase` is the internal union `"render" | "effect"`.

Render jobs execute before effect jobs in every cycle. Computed evaluation and cleanup are intentionally excluded because they are demand-driven and lifecycle-driven respectively.

See [Phases and Cycles](../../phases.md) and [`ISchedulerJob`](../../contracts/internal/scheduler-job.md).
