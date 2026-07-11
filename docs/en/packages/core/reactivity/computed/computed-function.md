# `ComputedFunctionType<T>`

`ComputedFunctionType<T>` is a pure zero-argument operation that derives a value from reactive sources.

Executing it inside a computed collection records every source read as a dynamic dependency. Its result becomes the computed object's memoized value after successful evaluation.

The function must not perform external side effects or reactive writes. Those behaviors belong to effects and explicit mutations.

See [`Computed<T>`](index.md) and [Dependency Tracking](../tracking/index.md).
