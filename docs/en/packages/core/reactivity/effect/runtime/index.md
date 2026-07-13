# Effect Runtime

`EffectRuntime` is the internal owned implementation of [`Effect`](../index.md). It combines the nominal reactive consumer and scheduler-job roles without exposing either service through the public object.

## Scheduling

Construction registers ownership disposal, enqueues the effect-phase job, and requests a flush. Outside a batch or active flush, the initial callback therefore completes before effect creation returns. Inside a batch, execution waits for the outermost boundary. Scheduler identity deduplication permits one pending appearance at a time.

Invalidation enqueues the effect but does not flush directly. The source that completes synchronous graph invalidation requests the flush, ensuring every connected consumer is marked before execution begins. A source already read by the active attempt may reserve a later cycle without committing its candidate dependency early.

## Execution resources

`EffectExecutionRuntime` collects candidate cleanups only while one callback is active. Closing it transfers its ledger once and rejects retained registration attempts.

Before reevaluation, committed cleanups execute untracked in last-in-first-out order. Every cleanup is attempted. Any failure prevents the new callback from starting but leaves its previously committed dependencies connected for a future invalidation.

A successful callback atomically commits its dynamic dependencies and candidate cleanup ledger. A failed callback rolls back candidate dependencies, closes registration, releases every candidate cleanup in LIFO order, and reports the original and cleanup failures together when necessary.

## Disposal

Disposal is idempotent. It marks the effect closed, cancels pending scheduling, disconnects committed dependencies, closes any active execution, and releases all remaining cleanup resources. Cleanup failures pass through the ownership path when disposal belongs to a scope or runtime ledger.

See [Tracking Runtime](../../tracking/runtime/index.md), [Scheduler Runtime](../../../scheduler/runtime/index.md), and [Ownership Runtime](../../../ownership/runtime/index.md).
