# `ReactiveRuntime`

`ReactiveRuntime` is the public root object responsible for creating, coordinating, and disposing reactive resources and root ownership scopes.

Its current surface creates mutable signals through `signal(initialValue, options?)`, lazy derived values through `computed(computation)`, synchronous side effects through `effect(effect)`, scheduling boundaries through `batch(operation)`, and root scopes through `scope()`. `dispose()` recursively closes the root ownership stack and permanently closes the runtime.

[`Runtime.create()`](../api/index.md) is the canonical construction point. Each call creates a frozen public runtime backed by a private composition root containing independent tracking, ownership, scheduling, and batching services. `dispose()` releases owned resources in reverse order and permanently clears pending scheduler work.

See [Signal](signal/index.md), [Computed](computed/index.md), [Effect](effect/index.md), [Batching](batching/index.md), and [Scope](../ownership/scope/index.md).
