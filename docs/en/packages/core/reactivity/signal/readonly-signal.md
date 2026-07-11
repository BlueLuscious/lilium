# `ReadonlySignal<T>`

`ReadonlySignal<T>` is the minimal public contract for observing a reactive value without receiving mutation capabilities.

Its `get()` method returns the current value. Once the runtime exists, calling `get()` inside an active reactive consumer will register that consumer as a dependency.

`Signal<T>` extends this contract, allowing mutable signals to be passed safely to APIs that require read-only access.

See [`Signal<T>`](index.md) and [`SignalUpdaterType<T>`](signal-updater.md).
