# `SignalUpdaterType<T>`

`SignalUpdaterType<T>` is a pure function that receives the latest value stored by a signal and returns its next value.

It is used by [`Signal<T>.update()`](index.md) to support updates that cannot safely rely on an earlier read. The function must preserve the signal's generic value type.
