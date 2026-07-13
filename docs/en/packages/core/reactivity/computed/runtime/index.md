# Computed Runtime

`ComputedRuntime<T>` is the internal owned implementation of [`Computed<T>`](../index.md). It combines the nominal reactive consumer and source roles without exposing either graph collection.

## Lazy evaluation

Construction stores the computation but does not execute it. The first `get()` tracks the computed as a source for any parent consumer and transactionally evaluates its operation as the active nested consumer. A successful evaluation commits dynamic dependencies and caches its result. Clean reads return the cache without executing the computation again.

`Object.is` compares a successful reevaluation with the committed cache. An equal result preserves the existing cached value; a changed result replaces it.

## Invalidation

The first dependency invalidation after a successful evaluation marks the cache stale and invalidates consumers connected to the computed source. Additional invalidations while stale do nothing. Reevaluation remains lazy until the next `get()`.

Computed chains propagate staleness through their source role while evaluating from the innermost stale dependency outward only when read.

## Failure and cycle handling

The tracker commits dependencies only after the computation returns. A thrown evaluation therefore preserves the previous graph and cache, leaves the computed stale, restores its parent tracking frame, and rethrows. A later `get()` retries.

An evaluation flag rejects direct or indirect recursive reads before they recurse indefinitely. The flag is restored in `finally`, so a cycle or another failure does not permanently block retries.

## Ownership cleanup

Construction registers one disposer under the active scope or runtime root. Disposal disconnects dependencies owned by the consumer role, removes subscribers connected to the source role, and permanently closes `get()`.

See [Tracking Runtime](../../tracking/runtime/index.md) and [Ownership Runtime](../../../ownership/runtime/index.md).
