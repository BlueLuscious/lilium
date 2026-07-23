# Renderer Runtime

Status: **Implemented and available through `Renderer`**

`RendererRuntime<Root>` is reusable and bound to one Core runtime and one host adapter. Each mount
creates independent application ownership and an exclusive host session. The runtime owns neither
configured dependency.

| Contract or type | Responsibility | Relationships |
| --- | --- | --- |
| `RendererRuntime<Root>` | Declare explicit standalone Template and templated Component mount operations. | Returns `RenderedTemplate` or `RenderedComponent`; handled initial failures return `undefined`. |
| `RendererTemplateMountOptionsType<Root, State>` | Supply one external root, exact Template state object, and optional parent Core scope. | Consumed by `mountTemplate()`. |
| `RendererComponentMountOptionsType<Root, Inputs>` | Supply one external root, complete initial component inputs, and optional parent Core scope. | Uses `ComponentInputValuesType`; consumed by `mountComponent()`. |

The two operations remain distinct so state replacement and component input updates cannot be
confused. Standalone Template state is retained by reference and exposed read-only; Component root
inputs may later be replaced only through the returned `RenderedComponent` handle.

The concrete runtime is private and frozen. `Renderer.createRuntime()` validates and retains one
Core runtime and host adapter; it allocates no application scope or host session until a mount.

Each mount performs these stages synchronously:

1. Create an application scope beneath the optional owner.
2. Claim the external root and open one exclusive host session.
3. Register session closure before the child resource scope so LIFO cleanup closes last.
4. Preflight the exact Template or composition before host mutation.
5. Execute and place the root occurrence inside one Core batch.
6. Attach the successful occurrence to one public mounted lifecycle.

A handled opening, preflight, setup, binding, or host failure returns `undefined` after cleanup. A
propagated failure throws after the same cleanup path; multiple failures preserve the original
failure first. Successful handles support idempotent explicit disposal and inherited ancestor
disposal. See [Mount boundaries](../../../architecture/renderer-protocol.md#mount-boundaries).
