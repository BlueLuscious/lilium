# Scheduler Runtime

`SchedulerRuntime` implements [`IScheduler`](../contracts/internal/scheduler.md) as a runtime-isolated synchronous service. It is internal and is not exported from `@lilium/core`.

## Queue model

The scheduler stores current- and next-cycle FIFO arrays for `render` and `effect`. A pending map deduplicates jobs by object identity. Each enqueue creates a [`TSchedulerQueueEntry`](../types/internal/scheduler-queue-entry.md), allowing cancellation of one appearance without invalidating a later enqueue of the same job.

Before a flush, jobs enter the current cycle. While flushing, work for a phase that has not started joins the current cycle; work for the active or completed phase enters the next cycle. A running job is removed from the pending map before execution, so it may enqueue one later appearance without recursive execution.

## Ownership and failures

The first enqueue permanently associates a job identity with the active scope or runtime root. Execution restores that owner through `OwnershipManager`, so context lookup, resource ownership, and error-boundary traversal use the consumer's semantic owner.

A handled job failure returns control to the phase queue. An unhandled failure clears all pending appearances and escapes the outer `flush()`. Recursive `flush()` calls return immediately and leave reentrant work to normal cycle progression.

## Cycle limit

After 100 completed cycles, additional pending work is cleared and a deterministic cycle-limit error is routed through the owner of the first overflowing job. A handled cycle error closes the flush; an unhandled one reaches its synchronous caller.

See [Phases and Cycles](../phases.md) for accepted ordering rules and [Execution Model](../../../../architecture/execution-model.md) for framework-wide scheduling guarantees.
