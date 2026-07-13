# `SignalUpdaterType<T>`

`SignalUpdaterType<T>` is a pure function that receives the latest value stored by a signal and returns its next value.

It is used by [`Signal<T>.update()`](index.md) to support updates that cannot safely rely on an earlier read. The function must preserve the signal's generic value type.

Updater callbacks execute without dependency tracking because `update()` is a mutation command rather than a reactive computation. Reading another signal inside an updater therefore does not attach that source to an enclosing consumer.

See the [Signal Runtime](runtime/index.md).
