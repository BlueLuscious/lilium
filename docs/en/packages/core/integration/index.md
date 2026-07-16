# Core Integration

Status: **Runtime implemented**

`@lilium/core/integration` is a supported adapter-facing subpath for Renderer. It is intentionally
absent from the `@lilium/core` package root and grants only render-binding creation authority.

## Contracts

- [`CoreIntegrationApi`](contracts/core-integration-api.md) binds integration authority to one genuine Core runtime.
- [`RenderBindingRuntime`](contracts/render-binding-runtime.md) creates tracked owned bindings.
- [`RenderBinding`](contracts/render-binding.md) exposes only idempotent cancellation.

## Runtime

- [`CoreIntegration`](api/index.md) validates and connects one genuine Core runtime.
- [Render binding runtime](runtime/index.md) owns tracked execution, scheduling, protected handles, and terminal settlement.

## Types

- [`RenderBindingFunctionType`](types/render-binding-function.md) is synchronous tracked render work.
- [`RenderBindingTerminalFunctionType`](types/render-binding-terminal-function.md) finalizes the occurrence after binding failure.

The subpath exposes no scheduler phase, queue, flush, tracker, graph mutation, ownership manager, or
runtime implementation. The accepted authority and lifecycle are defined by
[Rendering Integration](../../../architecture/rendering-integration.md).
