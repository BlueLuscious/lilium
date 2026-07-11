# `SignalEqualityType<T>`

`SignalEqualityType<T>` compares the current value of a signal with the candidate produced by `set()` or `update()`.

- Returning `true` preserves the current value and prevents invalidation.
- Returning `false` stores the candidate value and invalidates dependents.
- Throwing cancels the write and preserves the current value.

The runtime executes equality functions without reactive dependency tracking. `Object.is` is used when signal creation does not provide a custom function.

Returning `false` unconditionally provides explicit always-notify behavior without adding a special boolean option.
