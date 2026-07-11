# Future Reactive Primitives

These concepts are intentionally outside the synchronous foundation and require dedicated design before contracts are introduced.

## `AsyncEffect`

An asynchronous side effect with explicit cancellation, execution identity, stale-result handling, and ownership behavior. It must not weaken the synchronous `Effect` contract.

## `Task`

An identity-bearing asynchronous operation with status, result, error, cancellation, and concurrency policy. Tasks may be imperative rather than dependency-tracked.

## `Resource<T>`

A reactive representation of asynchronous data derived from reactive inputs. It may coordinate tasks while exposing pending, resolved, stale, and failed states.

## Deep reactive objects

A proxy-based abstraction that tracks property access and mutation. It would use the same reactive graph while remaining separate from shallow `Signal<T>` semantics.
