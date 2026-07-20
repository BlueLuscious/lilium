# Renderer API

Status: **Contract declared; facade pending**

`RendererApi` defines the stateless object API that the future frozen `Renderer` value will
implement. It has one construction operation:

| Contract | Responsibility | Relationships |
| --- | --- | --- |
| `RendererApi` | Create a reusable Renderer runtime from one genuine Core runtime and one reusable host adapter. | Accepts `ReactiveRuntime` and `RendererHost`; returns `RendererRuntime`. |

`createRuntime()` preserves the adapter's `Root`, `Parent`, and `Value` relationship while exposing
only the external `Root` type through the resulting runtime. Parent and value handles remain
private to execution and never appear in mounted application handles.

The concrete `Renderer` value is intentionally not exported during the contract-only phase. This
avoids publishing an incomplete facade whose mount operations cannot yet satisfy the accepted
preflight, cleanup, and failure guarantees. See the
[public object model](../../../architecture/renderer-protocol.md#public-object-model).
