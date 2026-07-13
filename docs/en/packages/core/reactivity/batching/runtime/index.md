# Batching Runtime

`BatchingManager` is the internal synchronous scheduling-boundary coordinator used by one reactive runtime.

## Depth and visibility

Entering `batch()` increments private nesting depth. Writes, equality checks, graph invalidation, and explicit reads remain immediate. `requestFlush()` drains the scheduler only when depth is zero, so effects remain pending while any nested boundary is active.

Every exit restores depth in `finally`. A successful inner batch never flushes independently. A failing inner batch also avoids flushing while an outer boundary remains active, allowing the outer callback to catch the error and continue grouping writes.

## Outermost exit

After the outermost operation returns or throws, the manager synchronously flushes pending work. Accepted writes are never rolled back. One callback or flush failure is rethrown unchanged; simultaneous callback and flush failures are preserved in one `AggregateError` in that order.

Batch callbacks are required to return `undefined` at both the type and runtime boundaries. Batching introduces no identity, ownership, asynchronous boundary, or transaction semantics.

See [Batching](../index.md), [Scheduler Runtime](../../../scheduler/runtime/index.md), and the architecture [Execution Model](../../../../../architecture/execution-model.md).
