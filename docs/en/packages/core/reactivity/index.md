# Reactivity

Status: **In design**

The reactivity feature provides target-independent reactive values and will later own dependency tracking, computed values, effects, and batching.

The first approved API slice defines mutable and read-only signal objects. It deliberately excludes runtime graph contracts until propagation and ownership semantics are accepted.

## Public contracts

- [`Computed<T>`](contracts/computed.md) exposes a lazy memoized derived value.
- [`ReactiveRuntime`](contracts/reactive-runtime.md) creates and coordinates reactive resources.
- [`ReadonlySignal<T>`](contracts/readonly-signal.md) exposes tracked reads without mutation.
- [`Signal<T>`](contracts/signal.md) adds explicit writes and updates.

## Public types

- [`ComputedFunctionType<T>`](types/computed-function.md) derives a computed value.
- [`SignalEqualityType<T>`](types/signal-equality.md) determines whether a write is observable.
- [`SignalOptionsType<T>`](types/signal-options.md) configures signal creation.
- [`SignalUpdaterType<T>`](types/signal-updater.md) derives a signal's next value from its latest value.

## Relationships

`Signal<T>` and `Computed<T>` extend `ReadonlySignal<T>`. A signal accepts `SignalUpdaterType<T>` in its `update()` method, while a computed evaluates a `ComputedFunctionType<T>`. `ReactiveRuntime` creates both objects.

The internal [dependency tracking](dependency-tracking.md) contracts connect future signal runtime objects to reactive consumers without exposing graph collections through the public API.

## Internal contracts and types

- [`IReactiveSource`](contracts/internal/reactive-source.md) identifies a trackable value.
- [`IReactiveConsumer`](contracts/internal/reactive-consumer.md) receives invalidation.
- [`IReactiveTracker`](contracts/internal/reactive-tracker.md) owns collection and graph connections.
- [`IReactiveRuntimeContext`](contracts/internal/reactive-runtime-context.md) bridges runtime implementations to their tracker.
- [`TReactiveComputation<T>`](types/internal/reactive-computation.md) represents tracked and untracked operations.

## Deferred concepts

- Effects and effect cleanup.
- Batching and transactions.
- Ownership integration.
- Deep reactive proxies as a separate future abstraction.
