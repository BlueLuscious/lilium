# `Scope`

`Scope` is an explicit object that owns resources, child scopes, and synchronous cleanups.

## Creation

`ReactiveRuntime.scope()` creates an inactive root scope owned directly by the runtime. It does not implicitly attach to another active scope. `scope.child()` explicitly creates a child attached to that scope.

Portable context definitions may register one provider on a newly created scope before its first execution. Provider topology becomes immutable when `run()` starts.

## Execution

`scope.run(operation)` temporarily makes the scope the active owner. Signals, computed values, and effects created during the operation are registered in its ownership stack. The same open scope may execute multiple operations and accumulate resources.

Execution is synchronous and returns no value. Nested executions form a stack and always restore the previous active owner. Throwing does not roll back created resources; ownership is committed as each resource is registered, and the original error is rethrown after context restoration.

## Ownership stack

Resources, child scopes, and user cleanups share one registration-ordered stack. Disposal processes that stack in last-in-first-out order, preserving relationships between resources instead of disposing each category separately.

## Disposal

`dispose()` recursively closes the scope, cancels pending owned work, disconnects reactive dependencies, and executes cleanups. It is idempotent.

Disposal while the scope is actively running is rejected. After disposal, `run()`, `child()`, and `cleanup()` throw. An owned reactive object that escaped its scope also rejects reads, writes, or scheduling after the owner is disposed; calling its own `dispose()` remains safe when available.

All registered disposal operations are attempted even when one fails. Cleanup errors are delivered through the ownership error policy; without a boundary, one error is rethrown directly and multiple errors are reported as an `AggregateError` after disposal completes.

See [`ScopeFunctionType`](scope-function.md), [`ScopeCleanupType`](scope-cleanup.md), [`ReactiveRuntime`](../../reactivity/reactive-runtime.md), and [Context](../../context/index.md).
