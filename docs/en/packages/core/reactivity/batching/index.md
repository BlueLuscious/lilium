# Batching

Status: **Semantics accepted**

Batching groups synchronous writes into one scheduling boundary without staging or rolling back state.

## Execution

`ReactiveRuntime.batch(operation)` increments the runtime's batch depth, executes the operation, and restores the previous depth in a guaranteed finalization step. Pending work becomes eligible to flush only after the outermost scheduling boundary exits.

```text
outer batch
  write A
  inner batch
    write B
  inner exit: no flush
  write C
outer exit: pending work becomes flushable
```

## Visibility

Accepted writes are immediately visible to reads inside the batch. Equality is evaluated for each individual write. Computed values are marked stale immediately and may reevaluate when explicitly read, while scheduled renderer bindings and effects remain deferred.

## Deduplication

A consumer invalidated multiple times has at most one pending execution for the cycle. Batching does not compare the final batch state with its initial state, so restoring a signal's original value does not guarantee cancellation of already pending consumers.

## Errors

Throwing does not roll back writes. Runtime bookkeeping and nesting depth are restored before the original error is rethrown. If an outer batch catches an inner error, the outer scheduling boundary remains active.

## Transaction boundary

A batch is not an atomic transaction. See the architecture [Execution Model](../../../../architecture/execution-model.md) for the required guarantees a future transaction would need.

See [`BatchFunctionType`](batch-function.md) and [`ReactiveRuntime`](../reactive-runtime.md).
