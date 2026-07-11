# `ScopeFunctionType`

`ScopeFunctionType` is a synchronous zero-argument operation executed through `Scope.run()`.

It returns `undefined`, rejecting async operations and accidental return values at the TypeScript boundary. Reactive resources created during execution are owned by the active scope, and nested executions restore their previous owner even when an operation throws.

See [`Scope`](index.md).
