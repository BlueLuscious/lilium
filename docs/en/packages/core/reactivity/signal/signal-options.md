# `SignalOptionsType<T>`

`SignalOptionsType<T>` is the immutable configuration accepted by [`ReactiveRuntime.signal()`](../reactive-runtime.md).

Its optional `equals` member accepts a [`SignalEqualityType<T>`](signal-equality.md). Omitting it selects `Object.is` as the runtime default.

Options are read during signal creation and are not a mutable runtime configuration surface.
