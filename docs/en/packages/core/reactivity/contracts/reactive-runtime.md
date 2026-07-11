# `ReactiveRuntime`

`ReactiveRuntime` is the public object contract responsible for creating and coordinating reactive resources.

Its initial surface contains only `signal(initialValue, options?)`. Computed values, effects, batching, and ownership operations will be added only after their execution semantics are approved.

The contract does not determine how a runtime object itself is constructed. That remains an API-level decision.

See [`Signal<T>`](signal.md) and [`SignalOptionsType<T>`](../types/signal-options.md).
