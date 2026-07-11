# `ReactiveRuntime`

`ReactiveRuntime` is the public object contract responsible for creating and coordinating reactive resources.

Its current surface creates mutable signals through `signal(initialValue, options?)`, lazy derived values through `computed(computation)`, synchronous side effects through `effect(effect)`, and scheduling boundaries through `batch(operation)`. Ownership operations will be added only after their execution semantics are approved.

The contract does not determine how a runtime object itself is constructed. That remains an API-level decision.

See [Signal](signal/index.md), [Computed](computed/index.md), [Effect](effect/index.md), and [Batching](batching/index.md).
