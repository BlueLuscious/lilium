# Renderer Runtime

Status: **Contracts and mount option types declared; implementation pending**

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

No runtime class exists in Phase 00. Session opening, capability preflight, instruction execution,
reactive integration, and terminal cleanup are implemented by the ordered later phases. See
[Mount boundaries](../../../architecture/renderer-protocol.md#mount-boundaries).
