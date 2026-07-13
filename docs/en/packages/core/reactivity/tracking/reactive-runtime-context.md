# `IReactiveRuntimeContext`

`IReactiveRuntimeContext` is the internal bridge implemented by a concrete reactive runtime. It exposes the runtime's `IReactiveTracker`, internal scheduler, and batching-aware flush request to reactive resources without adding those operations to the public `ReactiveRuntime` contract.

Object identity of the context defines graph isolation: a source and consumer can connect only when they reference the same context.

See [`IReactiveTracker`](reactive-tracker.md), [Dependency Tracking](index.md), [Scheduler Runtime](../../scheduler/runtime/index.md), and [Batching Runtime](../batching/runtime/index.md).
