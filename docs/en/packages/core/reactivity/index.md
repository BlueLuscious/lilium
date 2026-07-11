# Reactivity

Status: **In design**

The reactivity feature provides target-independent reactive values and will later own dependency tracking, computed values, effects, and batching.

The first approved API slice defines mutable and read-only signal objects. It deliberately excludes runtime graph contracts until propagation and ownership semantics are accepted.

## Public contracts

- [`ReadonlySignal<T>`](contracts/readonly-signal.md) exposes tracked reads without mutation.
- [`Signal<T>`](contracts/signal.md) adds explicit writes and updates.

## Public types

- [`SignalUpdaterType<T>`](types/signal-updater.md) derives a signal's next value from its latest value.

## Relationships

`Signal<T>` extends `ReadonlySignal<T>` and accepts `SignalUpdaterType<T>` in its `update()` method. A future `ReactiveRuntime` will create signal objects and connect them to its internal dependency graph.

## Deferred concepts

- Signal equality and custom comparators.
- Computed values.
- Effects and effect cleanup.
- Dependency graph internals.
- Batching and transactions.
- Ownership integration.
