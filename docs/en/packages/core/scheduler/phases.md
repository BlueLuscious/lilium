# Scheduler Phases and Cycles

## Flush boundary

Lilium uses synchronous automatic flushing. A write outside a batch or active flush drains eligible work before the mutation operation returns. Exiting the outermost batch drains work before `batch()` returns or rethrows its callback error.

Calling `flush()` during an active flush never recursively starts another flush. Work is assigned to the current or next cycle according to phase progression.

## Phase order

Every scheduler cycle has two executable phases:

1. `render`: update host bindings using the latest reactive values.
2. `effect`: execute user effects after host updates.

Lazy computed values may reevaluate while either phase reads them. Cleanup executes inline before effect reevaluation or during disposal.

## Enqueue rules

- Work queued before a flush enters the first cycle.
- Work for a phase that has not started may join the current cycle.
- Work for the active phase enters the next cycle.
- Work for a completed phase enters the next cycle.
- During `render`, a new effect job may join the current `effect` phase.
- During `effect`, both new render and effect work enter the next cycle.

These rules prevent phase reentry and preserve `render -> effect` ordering across reactive writes.

## Ordering and deduplication

Each phase queue is FIFO. An object may be pending at most once across scheduler cycles. Repeated invalidation before execution does not add duplicate entries. If a job invalidates again after it starts executing, it may be queued once for a later cycle.

Cancellation removes pending appearances idempotently but does not interrupt a currently executing synchronous job.

## Cycle detection

One outer flush may process at most 100 scheduler cycles. Reaching the limit reports a reactive-cycle error and aborts remaining pending work. The concrete error contract and ownership-boundary routing are finalized with the error model.

## Ownership execution

Before a job executes, the runtime restores the owner associated with that consumer. Context resolution and resources created by the job therefore use its semantic owner rather than scheduler implementation state.

## Errors

Handled job errors may allow the scheduler to continue. The exact behavior for unhandled errors, remaining queues, and multiple errors is deferred to the ownership error-boundary design.
