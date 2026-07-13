# `TOwnershipUntrackedExecutor`

`TOwnershipUntrackedExecutor` is the internal generic adapter used to execute error-boundary handlers outside reactive dependency collection.

Ownership accepts this dependency during manager construction, keeping ownership independent from the concrete tracking implementation. Each Core runtime composition provides its own tracker-backed implementation.

See the [Ownership Runtime](../../runtime/index.md) and [Dependency Tracking](../../../reactivity/tracking/index.md).
