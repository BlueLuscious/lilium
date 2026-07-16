# `CoreIntegrationApi`

`CoreIntegrationApi` is the object contract implemented by the frozen `CoreIntegration` value
exported only from `@lilium/core/integration`.

`createRuntime(runtime)` accepts the public [`ReactiveRuntime`](../../reactivity/reactive-runtime.md)
contract and returns a [`RenderBindingRuntime`](render-binding-runtime.md). The concrete API must
reject structurally compatible foreign implementations at runtime. It borrows the runtime and
never owns or disposes it.

`assertRuntime(runtime)` verifies the same genuine live runtime identity without exposing its
private context or creating another capability. Adapter packages use this assertion instead of
depending on Core runtime implementation paths.

This contract separates adapter authority from the end-user `Runtime` API and the Core package root.
