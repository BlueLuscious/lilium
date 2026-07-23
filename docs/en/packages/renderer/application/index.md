# Rendered Applications

Status: **Contracts and private implementations complete**

Application contracts are the only public identities for mounted roots. Nested primitive,
fragment, component, fallback, and projection occurrences remain private Renderer concepts.

| Contract | Responsibility | Relationships |
| --- | --- | --- |
| `RenderedApplication` | Expose terminal `disposed` observation and idempotent root disposal. | Common lifecycle inherited by every successful mount handle. |
| `RenderedTemplate<State>` | Expose the exact standalone Template state as read-only data. | Extends `RenderedApplication`; returned by `RendererRuntime.mountTemplate()`. |
| `RenderedComponent<Inputs, Controller>` | Expose the ordinary read-only Component instance and complete root input updates. | Extends `RenderedApplication`; uses `ComponentInstance` and `ComponentInputValuesType`; returned by `mountComponent()`. |

## Runtime Concepts

| Concept | Responsibility | Relationships |
| --- | --- | --- |
| `RendererApplicationLifecycle<Parent, Value>` | Coordinate terminal state, the application scope, its resource child, and final session closure. | Retains one private root occurrence and runs explicit disposal inside a Core batch. |
| `RenderedTemplate<State>` | Implement the frozen public standalone Template handle. | Delegates disposal to `RendererApplicationLifecycle` and retains the exact state reference. |
| `RenderedComponent<Inputs, Controller>` | Implement the frozen public root Component handle. | Exposes only `ComponentInstance`; retains protected update authority privately. |
| `RenderedComponentInstance<Inputs, Controller>` | Preserve the genuine controller and input identities while making instance disposal root-aware. | Delegates `dispose()` to the complete Renderer application lifecycle. |

Disposal owns Renderer-created resources, not the external host root or configured Core runtime.
The application becomes terminal before any host callback. Explicit disposal cancels the root
occurrence, disposes ownership resources, and closes the session; ancestor scope disposal reaches
the same resources through Core ownership and updates the same `disposed` observation. Repeated or
reentrant disposal performs no additional host operation.

Root Component update failures enter the same terminal path. The original update failure remains
first, followed by any flattened cleanup failures in deterministic execution order.
Calling `RenderedComponent.component.dispose()` also disposes the complete rendered application;
the public instance cannot bypass host removal, primitive release, or session closure.

The complete ordering guarantee is defined by
[Ownership and disposal](../../../architecture/renderer-protocol.md#ownership-and-disposal).
