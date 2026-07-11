# `IReactiveConsumer`

`IReactiveConsumer` identifies an internal computation that observes reactive sources. Future computed values, effects, and renderer bindings may act as consumers.

It uses an internal type-only brand to prevent other graph roles from being accepted structurally as consumers. It belongs to one `IReactiveRuntimeContext` and exposes invalidation without defining immediate execution or scheduling. Dependency collections remain encapsulated by [`IReactiveTracker`](reactive-tracker.md).

See [Dependency Tracking](index.md).
