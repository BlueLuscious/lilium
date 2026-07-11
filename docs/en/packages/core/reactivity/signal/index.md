# `Signal<T>`

`Signal<T>` is a mutable reactive value object created by a future `ReactiveRuntime`.

It extends [`ReadonlySignal<T>`](readonly-signal.md) and provides two explicit commands:

- `set(value)` replaces the current value.
- `update(updater)` derives the next value from the latest stored value.

Both commands return nothing. Propagation timing and batching behavior remain deferred until the reactive execution model is closed.

Signals are shallow reactive cells. Writes use `Object.is` by default or the custom equality function supplied through [`SignalOptionsType<T>`](signal-options.md). Equal candidates are discarded without replacing the current value or invalidating dependents.

Mutating an object returned by `get()` is not observable by the signal. A future deep-proxy abstraction would be a separate feature rather than a change to this contract.

Concrete signal implementation classes are runtime details and are not part of this public contract.

See [`ReadonlySignal<T>`](readonly-signal.md), [`SignalEqualityType<T>`](signal-equality.md), [`SignalOptionsType<T>`](signal-options.md), [`SignalUpdaterType<T>`](signal-updater.md), and [`ReactiveRuntime`](../reactive-runtime.md).
