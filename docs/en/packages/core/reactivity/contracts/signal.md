# `Signal<T>`

`Signal<T>` is a mutable reactive value object created by a future `ReactiveRuntime`.

It extends [`ReadonlySignal<T>`](readonly-signal.md) and provides two explicit commands:

- `set(value)` replaces the current value.
- `update(updater)` derives the next value from the latest stored value.

Both commands return nothing. Propagation timing, equality checks, and batching behavior remain deferred until the reactive execution model is closed.

Concrete signal implementation classes are runtime details and are not part of this public contract.

See [`SignalUpdaterType<T>`](../types/signal-updater.md).
