# `Computed<T>`

`Computed<T>` is a lazy memoized reactive value derived from other reactive sources. It extends [`ReadonlySignal<T>`](../signal/readonly-signal.md) and exposes only `get()`.

The first read evaluates and caches its computation. Clean reads reuse the cache. Dependency invalidation marks the computed stale, and the next read reevaluates it once.

Computed objects use `Object.is` when comparing a reevaluated result with the existing cache. Equal results preserve the existing cached value. Failed evaluations preserve the previous committed dependencies and cache, remain stale, and rethrow the error so a later read can retry.

A computed is both an internal reactive consumer and source. Its computation must be pure, and recursively reading the same computed during evaluation is an error.

A computed belongs to the active scope when created during [`Scope.run()`](../../ownership/scope/index.md) and otherwise belongs to the runtime root. Disposing that owner disconnects both graph roles and permanently closes reads.

Eager derivation is not an evaluation mode of this contract. It may become a separate abstraction if a concrete scheduling use case requires it.

See the [Computed Runtime](runtime/index.md) for the implemented cache, invalidation, retry, cycle, and disposal flow.

See [`ComputedFunctionType<T>`](computed-function.md), [`ReactiveRuntime`](../reactive-runtime.md), and [Dependency Tracking](../tracking/index.md).
