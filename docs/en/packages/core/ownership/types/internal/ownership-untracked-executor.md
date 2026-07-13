# `TOwnershipUntrackedExecutor`

`TOwnershipUntrackedExecutor` is the internal generic adapter used to execute error-boundary handlers outside reactive dependency collection.

Ownership accepts this dependency during manager construction, keeping ownership independent from the concrete tracking implementation. The Core runtime composition will provide the tracker-backed implementation in the next epic phase.

See the [Ownership Runtime](../../runtime/index.md) and [Dependency Tracking](../../../reactivity/tracking/index.md).
