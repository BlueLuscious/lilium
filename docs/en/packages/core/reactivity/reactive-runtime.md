# `ReactiveRuntime`

`ReactiveRuntime` is the public root object responsible for creating, coordinating, and disposing reactive resources and root ownership scopes.

Its current surface creates mutable signals through `signal(initialValue, options?)`, lazy derived values through `computed(computation)`, synchronous side effects through `effect(effect)`, scheduling boundaries through `batch(operation)`, and root scopes through `scope()`. `dispose()` recursively closes the root ownership stack and permanently closes the runtime.

The contract does not determine how a runtime object itself is constructed. That remains an API-level decision.

See [Signal](signal/index.md), [Computed](computed/index.md), [Effect](effect/index.md), [Batching](batching/index.md), and [Scope](../ownership/scope/index.md).
