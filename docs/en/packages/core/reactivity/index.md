# Reactivity

Status: **In design**

The reactivity feature provides target-independent reactive values and will later own dependency tracking, computed values, effects, and batching.

The first approved API slice defines mutable and read-only signal objects. It deliberately excludes runtime graph contracts until propagation and ownership semantics are accepted.

## Public contracts

- [`ReactiveRuntime`](contracts/reactive-runtime.md) creates and coordinates reactive resources.
- [`ReadonlySignal<T>`](contracts/readonly-signal.md) exposes tracked reads without mutation.
- [`Signal<T>`](contracts/signal.md) adds explicit writes and updates.

## Public types

- [`SignalEqualityType<T>`](types/signal-equality.md) determines whether a write is observable.
- [`SignalOptionsType<T>`](types/signal-options.md) configures signal creation.
- [`SignalUpdaterType<T>`](types/signal-updater.md) derives a signal's next value from its latest value.

## Relationships

`Signal<T>` extends `ReadonlySignal<T>` and accepts `SignalUpdaterType<T>` in its `update()` method. `ReactiveRuntime.signal()` creates signal objects using an optional `SignalOptionsType<T>`, which references `SignalEqualityType<T>`.

## Deferred concepts

- Computed values.
- Effects and effect cleanup.
- Dependency graph internals.
- Batching and transactions.
- Ownership integration.
- Deep reactive proxies as a separate future abstraction.
