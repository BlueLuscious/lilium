# `ErrorBoundaryDecisionType`

`ErrorBoundaryDecisionType` is the public union `"handled" | "propagate"`.

The union is type-only because handlers need choices for control flow but no runtime enum object. `"handled"` stops nearest-owner propagation; `"propagate"` preserves the original error for the parent boundary.

See [`ErrorBoundaryFunctionType`](error-boundary-function.md).
