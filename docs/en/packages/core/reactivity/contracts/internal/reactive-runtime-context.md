# `IReactiveRuntimeContext`

`IReactiveRuntimeContext` is the internal bridge implemented by a concrete reactive runtime. It exposes the runtime's `IReactiveTracker` to internal sources and consumers without adding tracking operations to the public `ReactiveRuntime` contract.

Object identity of the context defines graph isolation: a source and consumer can connect only when they reference the same context.

See [`IReactiveTracker`](reactive-tracker.md) and [Dependency Tracking](../../dependency-tracking.md).
