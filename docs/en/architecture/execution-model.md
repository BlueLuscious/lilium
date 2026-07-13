# Execution Model

Status: **Core and component foundation accepted**

## Component creation

A component definition is immutable and reusable. Creating it through a `ComponentRuntime` creates a headless component instance inside an ownership scope and initializes its setup logic exactly once.

Component state changes do not execute the whole component again. They invalidate only consumers that tracked the changed state.

Template instantiation and mounting are separate future compositions. They consume a successfully initialized headless instance but do not change its setup or ownership semantics.

## Signal writes

A signal is an explicit shallow reactive cell. It observes calls to `set()` and `update()` but does not intercept mutations inside stored objects.

Every write produces a candidate value and compares it with the current value. The default equality function is `Object.is`; signal creation may provide a custom equality function. When values compare as equal, the runtime preserves the current value and does not invalidate dependents. When equality evaluation throws, the write is cancelled and the previous value remains stored.

Equality evaluation does not participate in dependency tracking. Deep reactive proxies, if introduced later, are a separate abstraction built on the reactive graph and do not alter signal semantics.

Signal updater callbacks also execute untracked. `update()` is a mutation command that derives a candidate from the latest stored value; reactive reads performed inside its callback do not become dependencies of an enclosing consumer.

## Dependency tracking

Reactive dependency collection is runtime-isolated and transactional. A source read outside an active consumer returns its value without creating an edge. A read inside a consumer collection registers one edge between that source and consumer, regardless of how many times the source is read.

Each successful consumer execution atomically replaces its previous dependency set with the sources observed during that execution. If execution throws, newly collected edges are discarded, previous dependencies remain connected, the parent tracking context is restored, and the original error is rethrown.

Nested consumers form a stack. Completing, failing, or running an untracked operation always restores the previous active consumer. A tracked read across different `ReactiveRuntime` instances is rejected rather than silently creating a dependency between isolated graphs.

Dependency collection only records graph edges. Invalidation marks consumers stale or delegates to their scheduling policy; it does not require immediate execution. Disposing a consumer disconnects all of its edges idempotently.

See the core [Dependency Tracking](../packages/core/reactivity/tracking/index.md) feature documentation.

## Computed values

A `Computed<T>` is intrinsically lazy, memoized, and read-only. It has no evaluation mode, setter, manual refresh operation, or eager configuration.

The first `get()` evaluates its computation, transactionally collects dependencies, caches the result, and returns it. Additional reads return the cached result while the computed remains clean. Dependency invalidation marks it stale without immediately evaluating it; the next `get()` performs one reevaluation regardless of how many invalidations occurred.

A successful reevaluation replaces the cached result and commits its new dynamic dependencies. `Object.is` defines whether the candidate result is observably equal to the cached result; an equal candidate preserves the existing cached value. If evaluation throws, dependency collection rolls back, the previous cache remains available internally, the computed remains stale, and the error is rethrown to the caller. A later `get()` may retry.

Computed functions must be pure: they derive and return a value but do not perform external side effects or reactive writes. Effects represent reactive side effects. Recursive evaluation of the same computed value is a cycle and must throw rather than recurse indefinitely.

Internally, a computed participates in both graph roles: it consumes the sources read by its computation and acts as a source for consumers that call its `get()` method.

Eager derivation is intentionally not a `mode` of `Computed`. If a concrete use case requires eager cached derivation, it will be designed as a separate semantic abstraction with its own scheduling and error guarantees.

## Effects

An `Effect` is an identity-bearing disposable object for synchronous reactive side effects. Creating one registers its callback for the scheduler's effect phase; the object does not expose manual execution.

Effect callbacks receive an execution-scoped `EffectExecution` object. Its `cleanup()` method registers one or more synchronous cleanups. Cleanups run without dependency tracking in last-in-first-out order before reevaluation and during disposal. Each registration executes at most once, and retaining an execution object for later registration is invalid.

Effect execution transactionally collects dynamic dependencies. Multiple invalidations before a flush schedule at most one execution. A write performed by the active effect may schedule a later cycle but never reenters the same effect execution. The scheduler detects unbounded reactive cycles.

A source read and then written by the active effect invalidates its candidate consumer immediately for scheduling purposes, without committing the candidate graph edge early. This allows self-invalidation during the initial execution while preserving dependency rollback if the callback fails.

Before reevaluation, resources from the previous successful execution are cleaned. If the next callback fails, candidate dependencies are rolled back, cleanups registered by the failed attempt are released, and the effect remains connected to its previous committed dependencies for a later retry.

Errors are delivered to the nearest ownership error boundary. Without a boundary, the active flush propagates the error to its caller. Cleanup errors do not prevent remaining cleanups from running.

Effect callbacks and cleanups are strictly synchronous. Asynchronous work requires a future abstraction with explicit cancellation, staleness, and concurrency semantics.

Disposal is idempotent: it cancels pending execution, disconnects dependencies, runs remaining cleanups, and prevents future invalidation. Effects belong to the active ownership scope when one exists.

Renderer bindings are internal consumers scheduled in the render phase, not public effects. Therefore user effects observe host updates after renderer bindings have completed.

## Batching

`ReactiveRuntime.batch(operation)` creates a synchronous scheduling boundary around one or more reactive writes. It is an operation on the runtime rather than an identity-bearing object because it has no independent lifecycle, configuration, or disposal.

Writes inside a batch are applied immediately. Signal equality runs per write, and reads observe the latest accepted value. Dependency invalidation also occurs immediately so an explicitly read stale computed can reevaluate consistently inside the batch. Scheduled computed work, renderer bindings, and effects do not execute until the outermost active scheduling boundary exits.

Nested batches share their outer boundary. Exiting an inner batch never flushes independently. Multiple invalidations deduplicate pending consumers, but batching does not implement net-change rollback: writing a value and later restoring its original value may still leave consumers pending from the first accepted write.

Batch operations are strictly synchronous and return no value. If an operation throws, accepted writes remain committed, batch depth and tracking context are restored, the runtime performs the same flush bookkeeping required by a successful exit, and the original error is rethrown. A caught inner-batch error does not force a flush while an outer batch remains active.

Batching does not introduce a microtask boundary. Exiting the outermost batch synchronously flushes pending work before returning or propagating the batch callback error.

If both the batch callback and its outermost flush fail, the runtime reports an `AggregateError` containing the callback failure followed by the flush failure. This preserves both independent observable failures.

## Transactions

Batching is not a transaction. A transaction would require staged values, isolation, explicit commit or rollback, computed cache rollback, and nested savepoint semantics. Lilium does not expose a `Transaction` contract until a concrete use case justifies those guarantees.

## Ownership scopes

`ReactiveRuntime` is the root owner and lifecycle boundary. `runtime.scope()` creates an explicit root scope, and `scope.child()` creates an explicit parent-child relationship. A scope becomes active only during its synchronous `run()` operation.

Reactive resources created with an active scope belong to that scope; resources created without one belong directly to the runtime. Scope execution forms a runtime-isolated stack and restores the previous owner in a guaranteed finalization step. Throwing from a scoped operation does not roll back resources already registered.

Each owner stores resources, child scopes, and cleanups in one registration-ordered ledger. Disposal processes the ledger in last-in-first-out order, attempts every entry even after errors, disconnects graph dependencies, and prevents disposed resources from participating in future reactive work.

Scope and runtime disposal are idempotent. Disposing an actively executing scope is rejected. Operations other than repeated disposal are rejected after an owner closes.

See the core [Ownership](../packages/core/ownership/index.md) feature documentation.

## Context resolution

A `ContextIdentity<T>` is a runtime-independent immutable identity. Ownership scopes store provider entries for that identity, while the active owner determines lookup position.

Provider registration is setup-only: one value per context may be attached before a scope's first execution. Resolution walks from the active scope toward the runtime root and returns the nearest provider. Missing lookup returns the context's immutable default or throws when no default exists. Explicit `undefined` values remain distinguishable from missing providers.

Context lookup itself is not reactive. Applications provide reactive objects when consumers must observe contextual changes. The same context definition can be shared by component libraries across multiple runtimes without sharing provider state.

See the core [Context](../packages/core/context/index.md) feature documentation.

## Scheduler execution

Writes and dependency invalidation happen synchronously before scheduling. The scheduler then drains two executable phases per cycle:

1. **Render**: affected renderer bindings update host nodes.
2. **Effect**: affected user effects execute after visible updates.

Computed values are lazy and refresh when a render or effect job reads them. Cleanup runs inline before effect reevaluation or through ownership disposal, not in a global queue.

Flushes are synchronous and automatic outside batching. FIFO queues deduplicate jobs by object identity. Work targeting an active or completed phase moves to the next cycle, preventing recursive phase execution. A flush is limited to 100 cycles to detect unbounded reactive loops.

See the core [Scheduler](../packages/core/scheduler/index.md) feature documentation.

## Future template model

A future template contains stable structure plus dynamic binding declarations. A binding reads reactive values and applies its latest result through renderer operations. This enables fine-grained updates without diffing complete trees.

The template representation, renderer protocol, cleanup timing, and compiled ABI are intentionally deferred to their own foundation epic. They are not prerequisites for Core or headless Component runtime implementation.

## Disposal

Disposing a reactive runtime recursively disposes its root resources, scopes, effects, computations, component instances, and registered cleanups according to the ownership ledger. Repeated disposal is safe.

A future mounted application will additionally own renderer bindings and host nodes through its root scope.

## Error boundaries

An `ErrorBoundary` is a specialized child scope with an immutable synchronous handler. Owned failures propagate to the nearest boundary and then toward parent owners. The handler returns `"handled"` to stop propagation or `"propagate"` to preserve the original error.

Handlers execute untracked. Reactive writes are allowed and obey scheduler reentry, while creation of new owned resources is rejected during recovery. A handler failure is aggregated with the original error before parent propagation.

Boundaries protect owned scope execution, scheduled jobs, lifecycle cleanup, disposal, and future component or renderer work. Direct imperative operations continue throwing synchronously unless invoked inside protected owned execution.

Handled scheduler job errors allow the flush to continue. An unhandled scheduled error aborts the flush, discards remaining pending jobs, and propagates to the synchronous caller. Disposal attempts every ledger entry and aggregates only errors that no boundary handled.

See the ownership [Error Boundary](../packages/core/ownership/error-boundary/index.md) documentation.
