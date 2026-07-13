# Tracking Runtime

The tracking runtime implements [`IReactiveTracker`](../reactive-tracker.md) without exposing graph collections through the public Core API.

## `ReactiveTrackerRuntime`

Each tracker owns two private weak indexes: committed sources by consumer and committed consumers by source. `collect()` creates an empty candidate set and executes the consumer through `ReactiveTrackingContextManager`. A successful return reconciles candidate and committed edges; a thrown error skips reconciliation, so the previous graph remains intact.

`track()` deduplicates reads in the candidate `Set`. `invalidate()` traverses a stable subscriber snapshot, allowing consumer invalidation to disconnect or modify graph state safely. `disconnect()` removes both sides of every committed edge and is idempotent.

## `ReactiveTrackingContextManager`

The context manager stores only the current synchronous collection frame. Before tracked, nested, or untracked execution, it saves the previous tracker, consumer, and candidate set and restores them in `finally`.

The active frame is process-wide so a source can detect that its read occurred under a consumer from another runtime. It does not store graph edges: all mutable graph representation remains isolated in the owning `ReactiveTrackerRuntime`.

See [Dependency Tracking](../index.md) for accepted semantics and [Execution Model](../../../../../architecture/execution-model.md) for framework-wide reactive guarantees.
