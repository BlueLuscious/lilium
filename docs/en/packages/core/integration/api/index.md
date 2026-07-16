# Core Integration API

## `CoreIntegration`

`CoreIntegration` is the frozen object exported from `@lilium/core/integration`. It implements
[`CoreIntegrationApi`](../contracts/core-integration-api.md) and is intentionally absent from the
`@lilium/core` package root.

`CoreIntegration.createRuntime(runtime)` verifies that `runtime` is a genuine live Core runtime and
returns a frozen [`RenderBindingRuntime`](../contracts/render-binding-runtime.md). Structural objects
and runtimes from an invalid implementation boundary are rejected before integration state escapes.

`CoreIntegration.assertRuntime(runtime)` performs the same genuine-live-runtime assertion without
creating a binding capability. It exists for other authorized adapter subpaths, such as Component
Integration, that must validate a runtime without importing Core implementation classes.

The API borrows the runtime and exposes no method that disposes it or accesses its scheduler,
tracker, ownership manager, or private composition context.
