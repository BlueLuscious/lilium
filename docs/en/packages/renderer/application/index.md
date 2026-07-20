# Rendered Applications

Status: **Contracts declared**

Application contracts are the only public identities for mounted roots. Nested primitive,
fragment, component, fallback, and projection occurrences remain private Renderer concepts.

| Contract | Responsibility | Relationships |
| --- | --- | --- |
| `RenderedApplication` | Expose terminal `disposed` observation and idempotent root disposal. | Common lifecycle inherited by every successful mount handle. |
| `RenderedTemplate<State>` | Expose the exact standalone Template state as read-only data. | Extends `RenderedApplication`; returned by `RendererRuntime.mountTemplate()`. |
| `RenderedComponent<Inputs, Controller>` | Expose the ordinary read-only Component instance and complete root input updates. | Extends `RenderedApplication`; uses `ComponentInstance` and `ComponentInputValuesType`; returned by `mountComponent()`. |

Disposal owns Renderer-created resources, not the external host root or configured Core runtime.
The complete ordering guarantee is defined by
[Ownership and disposal](../../../architecture/renderer-protocol.md#ownership-and-disposal).
