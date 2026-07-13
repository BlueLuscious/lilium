# Dependency Tracking

Status: **Runtime implemented**

Dependency tracking connects reactive sources to the consumers that read them. The graph is isolated per `ReactiveRuntime` and hidden behind `IReactiveTracker`.

See the [Tracking Runtime](runtime/index.md) for the implemented collection and graph-reconciliation flow.

## Collection rules

1. Reading a source without an active consumer creates no dependency.
2. Starting collection pushes the consumer onto the runtime's tracking stack.
3. Every source read records a candidate edge for the active consumer.
4. Repeated reads of the same source produce one edge.
5. Successful execution atomically replaces the consumer's previous dependency set.
6. Failed execution discards candidate edges and preserves previous dependencies.
7. Completion or failure restores the previous tracking context.

This transactional replacement supports conditional dependencies without leaving a partially updated graph after an error.

## Dynamic dependencies

A consumer may observe different sources between executions. After a successful execution, sources that were not read again are disconnected and new sources are connected.

```text
first execution:  consumer -> source A, source B
next execution:   consumer -> source B, source C
committed graph:  consumer -> source B, source C
```

## Isolation

Sources and consumers must belong to the same runtime context. A tracked cross-runtime read throws because silently connecting isolated runtimes would make scheduling and disposal ambiguous.

## Untracked execution

Untracked execution temporarily suspends dependency collection and restores the previous consumer afterward. Signal equality functions and updater callbacks execute untracked because both belong to explicit mutation rather than reactive derivation.

## Invalidation and disposal

An accepted source change invalidates each connected consumer once according to that consumer's state and scheduler policy. Tracking itself does not execute consumers.

Disconnecting a consumer removes all dependency edges it owns. Disconnecting a source removes it from every connected consumer. Both operations are idempotent and allow resources with different ownership lifetimes to be collected independently.

## Representation boundary

Sources and consumers expose runtime identity and behavior but not mutable dependency collections. Sets, maps, edge objects, and collection algorithms remain runtime implementation details.

## Computed participation

A computed value acts as a consumer while evaluating its computation and as a source when another consumer reads its cached value. These two graph roles remain nominally distinct even when one runtime object implements both contracts.

## Effect participation

An effect acts only as a consumer. Successful execution commits its dynamic dependencies. Failed execution preserves its previous committed dependencies and releases resources registered by the failed attempt before reporting the error.
