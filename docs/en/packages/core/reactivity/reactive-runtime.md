# `ReactiveRuntime`

`ReactiveRuntime` is the public root object responsible for creating, coordinating, and disposing reactive resources and ownership scopes.

Its current surface creates mutable signals through `signal(initialValue, options?)`, lazy derived values through `computed(computation)`, synchronous side effects through `effect(effect)`, scheduling boundaries through `batch(operation)`, root scopes through `scope()`, and validated child scopes through `scope(owner)`. `dispose()` recursively closes the root ownership stack and permanently closes the runtime.

`scope(owner)` atomically verifies that the owner belongs to this runtime before registering a child. Plain, disposed, and foreign scopes are rejected, allowing adapter packages to create ownership safely without importing Core internals or exposing ownership inspection.

[`Runtime.create()`](../api/index.md) is the canonical construction point. Each call creates a frozen public runtime backed by a private composition root containing independent tracking, ownership, scheduling, and batching services. `dispose()` releases owned resources in reverse order and permanently clears pending scheduler work.

The internal concrete class intentionally shares the `ReactiveRuntime` domain name with the public contract. Module and layer boundaries distinguish the implementation, and the package root exports only the contract type. Its private `ReactiveRuntimeContext` composition owns the mutable services delegated to by the frozen runtime object; neither concrete class is publicly exported.

See [Signal](signal/index.md), [Computed](computed/index.md), [Effect](effect/index.md), [Batching](batching/index.md), and [Scope](../ownership/scope/index.md).
