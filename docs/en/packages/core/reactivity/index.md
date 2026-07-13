# Reactivity

Status: **Runtime implemented**

The reactivity feature provides target-independent reactive values and owns dependency tracking, computed values, effects, and batching semantics.

## Compositions

- [Signal](signal/index.md) defines mutable and read-only reactive cells, equality, options, and updates.
- [Computed](computed/index.md) defines lazy memoized derived values.
- [Effect](effect/index.md) defines synchronous tracked side effects and cleanup.
- [Batching](batching/index.md) defines synchronous scheduling boundaries.
- [Tracking](tracking/index.md) defines the internal source-consumer graph contracts.

## Runtime facade

[`ReactiveRuntime`](reactive-runtime.md) creates signals, computed values, and effects, and exposes batching as a one-shot operation. The facade composes the reactivity families without exposing graph implementation details.

## Relationships

Signals and computed values share the read-only reactive interface. Computed values consume reactive sources and expose their cached result as another source. Effects consume sources without producing reactive values. Batching controls when pending consumers become eligible for scheduler execution, while tracking owns their graph relationships.

## Deferred concepts

- Deep reactive proxies as a separate future abstraction.
- Asynchronous `AsyncEffect`, `Task`, and `Resource` abstractions.
- Atomic transactions with commit and rollback semantics.
