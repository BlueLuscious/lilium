# Execution Model

Status: **Draft**

## Component creation

A component definition is immutable and reusable. Mounting it creates a component instance inside an ownership scope. The instance initializes its setup logic once, instantiates its template, and registers dynamic bindings as reactive consumers.

Component state changes do not execute the whole component again. They invalidate only consumers that tracked the changed state.

## Signal writes

A signal is an explicit shallow reactive cell. It observes calls to `set()` and `update()` but does not intercept mutations inside stored objects.

Every write produces a candidate value and compares it with the current value. The default equality function is `Object.is`; signal creation may provide a custom equality function. When values compare as equal, the runtime preserves the current value and does not invalidate dependents. When equality evaluation throws, the write is cancelled and the previous value remains stored.

Equality evaluation does not participate in dependency tracking. Deep reactive proxies, if introduced later, are a separate abstraction built on the reactive graph and do not alter signal semantics.

## Dependency tracking

Reactive dependency collection is runtime-isolated and transactional. A source read outside an active consumer returns its value without creating an edge. A read inside a consumer collection registers one edge between that source and consumer, regardless of how many times the source is read.

Each successful consumer execution atomically replaces its previous dependency set with the sources observed during that execution. If execution throws, newly collected edges are discarded, previous dependencies remain connected, the parent tracking context is restored, and the original error is rethrown.

Nested consumers form a stack. Completing, failing, or running an untracked operation always restores the previous active consumer. A tracked read across different `ReactiveRuntime` instances is rejected rather than silently creating a dependency between isolated graphs.

Dependency collection only records graph edges. Invalidation marks consumers stale or delegates to their scheduling policy; it does not require immediate execution. Disposing a consumer disconnects all of its edges idempotently.

See the core [Dependency Tracking](../packages/core/reactivity/dependency-tracking.md) feature documentation.

## Computed values

A `Computed<T>` is intrinsically lazy, memoized, and read-only. It has no evaluation mode, setter, manual refresh operation, or eager configuration.

The first `get()` evaluates its computation, transactionally collects dependencies, caches the result, and returns it. Additional reads return the cached result while the computed remains clean. Dependency invalidation marks it stale without immediately evaluating it; the next `get()` performs one reevaluation regardless of how many invalidations occurred.

A successful reevaluation replaces the cached result and commits its new dynamic dependencies. `Object.is` defines whether the candidate result is observably equal to the cached result; an equal candidate preserves the existing cached value. If evaluation throws, dependency collection rolls back, the previous cache remains available internally, the computed remains stale, and the error is rethrown to the caller. A later `get()` may retry.

Computed functions must be pure: they derive and return a value but do not perform external side effects or reactive writes. Effects represent reactive side effects. Recursive evaluation of the same computed value is a cycle and must throw rather than recurse indefinitely.

Internally, a computed participates in both graph roles: it consumes the sources read by its computation and acts as a source for consumers that call its `get()` method.

Eager derivation is intentionally not a `mode` of `Computed`. If a concrete use case requires eager cached derivation, it will be designed as a separate semantic abstraction with its own scheduling and error guarantees.

## Proposed update phases

1. **Write**: one or more reactive values are changed.
2. **Invalidate**: dependent computations and bindings are marked stale.
3. **Compute**: stale computed values required by consumers are refreshed.
4. **Render**: affected renderer bindings update their host nodes.
5. **Effect**: affected user effects execute after visible updates.
6. **Cleanup**: replaced executions and disposed scopes release resources.

The exact sync and async boundaries remain open. The required guarantee is that phase ordering is deterministic and documented.

## Template model

A template contains stable structure plus dynamic binding declarations. A binding reads reactive values and applies its latest result through renderer operations. This enables fine-grained updates without diffing complete trees.

The template representation is an implementation boundary, not necessarily a public serializable format. A stable compiled component ABI must be defined before the `.lily` compiler is implemented.

## Disposal

Unmounting an application disposes its root scope. Disposal recursively removes renderer bindings, effects, computations, component instances, host nodes, and registered cleanups. Repeated disposal must be safe.

## Error boundaries

The foundation must define how errors move through owner and component boundaries. Error recovery behavior is still open and must be specified before runtime implementation.

## Open decisions

- Synchronous or deferred default rendering.
- Lazy or eager computed evaluation.
- Render effects as a distinct computation category.
- Cleanup timing relative to reruns and DOM removal.
- Cycle detection and maximum propagation depth.
- Error boundary ownership and recovery semantics.
