# Render Binding Runtime

The integration runtime consists of three internal concrete objects:

- `RenderBindingRuntime` retains one private Core runtime context and validates binding callbacks;
- `RenderBindingLifecycle` is the internal reactive consumer and render-phase scheduler job;
- `RenderBinding` is the protected frozen public wrapper exposing only `dispose()`.

## Creation flow

1. `CoreIntegration` verifies the supplied public runtime and resolves its private context.
2. `RenderBindingRuntime.create()` captures the active semantic owner.
3. The lifecycle registers idempotent owned disposal.
4. Initial render work executes synchronously under the captured owner and transactionally collects dependencies.
5. Success returns the protected public wrapper.
6. A handled initial failure returns `undefined`; an unhandled failure propagates after settlement.

## Update flow

An accepted source write invalidates the lifecycle through Core tracking. Scheduler identity
deduplication keeps one pending appearance, batching delays its flush, and the fixed `render` phase
runs it before eligible effects. Successful execution atomically replaces dynamic dependencies.

## Failure flow

Failed work marks the lifecycle terminal, cancels its scheduler appearance, and disconnects every
dependency before requesting deferred ownership settlement. After the outermost active owned
execution unwinds, Core runs the finalizer untracked and routes the original failure from the
captured semantic owner.

If finalization also fails, Core routes one `AggregateError` containing the render failure first and
the finalization failure second. A handled failure lets unrelated scheduler work continue; an
unhandled failure preserves existing scheduler abort and queue-clearing semantics.

## Disposal

Public, owner-driven, runtime-driven, and terminal disposal reach the same idempotent lifecycle
operation. Pending scheduling is cancelled and dependency edges are disconnected permanently.
