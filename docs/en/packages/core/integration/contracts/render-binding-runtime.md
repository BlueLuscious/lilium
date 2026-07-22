# `RenderBindingRuntime`

`RenderBindingRuntime` is bound to one genuine Core runtime by
[`CoreIntegrationApi`](core-integration-api.md). Its `create(operation, terminalize)` method creates
one binding under the currently active owner and performs the first tracked evaluation
synchronously.

A successful initial evaluation returns a [`RenderBinding`](render-binding.md). If initial work
fails and an ownership boundary handles the failure, creation returns `undefined`. An unhandled
failure propagates after terminalization and owned cleanup.

Later dependency invalidations are deduplicated and scheduled by Core in the accepted render phase.
The consumer cannot choose that phase, flush work, or invoke the binding directly.

`untrack(operation)` executes one synchronous operation with dependency collection suspended and
returns its exact result. Renderer uses it for Template equality operations so signals read by
equality do not become binding dependencies. This grants no tracker or graph access.

The runtime rejects foreign structural runtime implementations, disposed Core runtimes, non-function
operations, non-function terminalizers, non-function untracked operations, and non-`undefined`
binding callback results.

The operation and finalizer are described by
[`RenderBindingFunctionType`](../types/render-binding-function.md) and
[`RenderBindingTerminalFunctionType`](../types/render-binding-terminal-function.md).
