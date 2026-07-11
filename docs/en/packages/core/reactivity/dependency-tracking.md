# Dependency Tracking

Status: **Semantics accepted**

Dependency tracking connects reactive sources to the consumers that read them. The graph is isolated per `ReactiveRuntime` and hidden behind `IReactiveTracker`.

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

Untracked execution temporarily suspends dependency collection and restores the previous consumer afterward. Signal equality functions execute untracked. The tracking behavior of signal updater callbacks will be closed with write transaction semantics.

## Invalidation and disposal

An accepted source change invalidates each connected consumer once according to that consumer's state and scheduler policy. Tracking itself does not execute consumers.

Disconnecting a consumer removes all graph edges it owns. Repeated disconnection is safe.

## Representation boundary

Sources and consumers expose runtime identity and behavior but not mutable dependency collections. Sets, maps, edge objects, and collection algorithms remain runtime implementation details.

## Computed participation

A computed value acts as a consumer while evaluating its computation and as a source when another consumer reads its cached value. These two graph roles remain nominally distinct even when one runtime object implements both contracts.
