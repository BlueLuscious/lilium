# `BatchFunctionType`

`BatchFunctionType` is a synchronous zero-argument operation executed by `ReactiveRuntime.batch()`.

It returns `undefined`, rejecting async callbacks and accidental return values at the TypeScript boundary. Reactive writes made by the operation remain immediately visible and are never automatically rolled back.

See [Batching](../batching.md) and [`ReactiveRuntime`](../contracts/reactive-runtime.md).
