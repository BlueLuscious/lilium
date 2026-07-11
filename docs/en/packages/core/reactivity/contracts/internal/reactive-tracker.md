# `IReactiveTracker`

`IReactiveTracker` owns active-consumer state and dependency graph connections for one runtime context.

It provides transactional collection, source tracking, source invalidation, consumer disconnection, and temporarily untracked execution. Its public methods express graph behavior without exposing the graph's storage representation.

See [`IReactiveSource`](reactive-source.md), [`IReactiveConsumer`](reactive-consumer.md), and [Dependency Tracking](../../dependency-tracking.md).
