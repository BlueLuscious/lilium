# `IReactiveSource`

`IReactiveSource` identifies an internal value whose reads can be tracked. Signals and future computed values implement this contract.

It uses an internal type-only brand to prevent other graph roles from being accepted structurally as sources. It references its owning `IReactiveRuntimeContext` but does not expose subscribers or dependency collections. Graph connections belong to [`IReactiveTracker`](reactive-tracker.md).

See [Dependency Tracking](index.md).
