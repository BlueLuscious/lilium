# Core Integration

Status: **Contracts declared**

`@lilium/core/integration` is a supported adapter-facing subpath for Renderer. It is intentionally
absent from the `@lilium/core` package root and grants only render-binding creation authority.

## Contracts

- [`CoreIntegrationApi`](contracts/core-integration-api.md) binds integration authority to one genuine Core runtime.
- [`RenderBindingRuntime`](contracts/render-binding-runtime.md) creates tracked owned bindings.
- [`RenderBinding`](contracts/render-binding.md) exposes only disposal state and idempotent cancellation.

## Types

- [`RenderBindingFunctionType`](types/render-binding-function.md) is synchronous tracked render work.
- [`RenderBindingTerminalFunctionType`](types/render-binding-terminal-function.md) finalizes the occurrence after binding failure.

The subpath exposes no scheduler phase, queue, flush, tracker, graph mutation, ownership manager, or
runtime implementation. The accepted authority and lifecycle are defined by
[Rendering Integration](../../../architecture/rendering-integration.md).
