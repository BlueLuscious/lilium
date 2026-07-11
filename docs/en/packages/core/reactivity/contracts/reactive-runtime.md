# `ReactiveRuntime`

`ReactiveRuntime` is the public object contract responsible for creating and coordinating reactive resources.

Its current surface creates mutable signals through `signal(initialValue, options?)`, lazy derived values through `computed(computation)`, and synchronous side effects through `effect(effect)`. Batching and ownership operations will be added only after their execution semantics are approved.

The contract does not determine how a runtime object itself is constructed. That remains an API-level decision.

See [`Signal<T>`](signal.md), [`SignalOptionsType<T>`](../types/signal-options.md), [`Computed<T>`](computed.md), and [`Effect`](effect.md).
