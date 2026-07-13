# `Signal<T>`

`Signal<T>` is a mutable reactive value object created by a future `ReactiveRuntime`.

It extends [`ReadonlySignal<T>`](readonly-signal.md) and provides two explicit commands:

- `set(value)` replaces the current value.
- `update(updater)` derives the next value from the latest stored value.

Both commands return nothing. An accepted write stores its candidate and synchronously invalidates connected consumers. Effect flushing and batching are composed in the next Core runtime phase.

Signals are shallow reactive cells. Writes use `Object.is` by default or the custom equality function supplied through [`SignalOptionsType<T>`](signal-options.md). Equal candidates are discarded without replacing the current value or invalidating dependents.

Mutating an object returned by `get()` is not observable by the signal. A future deep-proxy abstraction would be a separate feature rather than a change to this contract.

Concrete signal implementation classes are runtime details and are not part of this public contract.

A signal belongs to the active scope when created during [`Scope.run()`](../../ownership/scope/index.md) and otherwise belongs directly to its reactive runtime. Disposing that owner permanently closes the signal.

See the [Signal Runtime](runtime/index.md) for the implemented read, write, equality, invalidation, and disposal flow.

See [`ReadonlySignal<T>`](readonly-signal.md), [`SignalEqualityType<T>`](signal-equality.md), [`SignalOptionsType<T>`](signal-options.md), [`SignalUpdaterType<T>`](signal-updater.md), and [`ReactiveRuntime`](../reactive-runtime.md).
