# `ErrorBoundaryFunctionType`

`ErrorBoundaryFunctionType` is a synchronous untracked callback that receives an `ErrorBoundaryEvent` and returns an `ErrorBoundaryDecisionType`.

Promise-returning handlers and arbitrary return values are rejected by TypeScript. Throwing from the handler propagates an aggregate containing both the handled error and handler failure.

See [`ErrorBoundary`](index.md) and [`ErrorBoundaryEvent`](error-boundary-event.md).
