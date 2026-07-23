# Renderer API

Status: **Implemented and exported**

`RendererApi` defines the stateless object API implemented by the frozen `Renderer` package-root
value. It has one construction operation:

| Contract | Responsibility | Relationships |
| --- | --- | --- |
| `RendererApi` | Create a reusable Renderer runtime from one genuine Core runtime and one reusable host adapter. | Accepts `ReactiveRuntime` and `RendererHost`; returns `RendererRuntime`. |

`createRuntime()` preserves the adapter's `Root`, `Parent`, and `Value` relationship while exposing
only the external `Root` type through the resulting runtime. Parent and value handles remain
private to execution and never appear in mounted application handles.

`Renderer.createRuntime()` validates one genuine live Core runtime and one synchronous host object.
The returned frozen runtime retains but does not own either dependency. See the
[public object model](../../../architecture/renderer-protocol.md#public-object-model) and
[Renderer Runtime](../runtime/index.md).
