# Renderer Host Protocol

Status: **Contracts declared; session negotiation implemented**

The host feature is the extension boundary implemented by future DOM, console, server, or native
adapters. Generic parent and value handles are opaque objects: Renderer stores identity and
placement metadata but never reads target state from them.

## Contracts

| Contract | Responsibility | Relationships |
| --- | --- | --- |
| `RendererHost<Root, Parent, Value>` | Open one exclusive session for an externally owned root. | Produces `RendererHostSession`; `Value` must extend `Parent`. |
| `RendererHostSession<Parent, Value>` | Wrap the claimed root, resolve primitive capabilities, place and remove values, and close terminally. | Uses `RendererPrimitiveCapability`, `RendererPlacementType`, and `RendererAttachmentType`. |
| `RendererPrimitiveCapability<Parent, Value, Primitive>` | Create and release detached values and resolve exact property support. | Identifies one `TemplatePrimitive`; resolves `RendererPropertyCapability`. |
| `RendererPropertyCapability<Value, Primitive, PropertyValue>` | Atomically commit one typed property candidate to one host value. | Identifies one exact `TemplateProperty`. |

## Types

| Type | Responsibility | Relationships |
| --- | --- | --- |
| `RendererAttachmentType<Parent>` | Record the current immediate parent of an attached value. | Supplied to `place()` for movement and to `remove()` for detachment. |
| `RendererPlacementType<Parent, Value>` | Record a destination parent and before-sibling anchor. | `before: null` means the end of the ordered child sequence. |

All operations are synchronous and operation-level atomic. Capability support uses Template object
identity rather than diagnostic names. The host never receives complete definitions, bindings,
component identities, scopes, or ownership objects. See
[Host adapter and session](../../../architecture/renderer-protocol.md#host-adapter-and-session).

The private [Session](../session/index.md) feature now validates `open()` and `close()` results and
owns exclusive root claims. The private [Preflight](../preflight/index.md) feature uses only
capability resolution operations before execution begins. `RendererHostProtocolValidator`
validates created object handles and the required undefined results of static write and placement
operations before private occurrence state is committed.
