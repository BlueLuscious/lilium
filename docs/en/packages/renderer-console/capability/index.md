# Renderer Console Capabilities

Status: **Implemented**

## Contracts And Types

| Contract or type | Responsibility | Relationships |
| --- | --- | --- |
| `ConsolePrimitiveDefinition<Primitive>` | Preserve one exact primitive identity, child support, and ordered unique properties. | Consumed by `ConsoleHostOptionsType` and resolved as a Renderer primitive capability. |
| `ConsolePrimitiveOptionsType<Primitive>` | Provide optional child and property support during declaration. | Accepted by `RendererConsole.primitive()`. |

## Runtime Concepts

| Concept | Responsibility | Relationships |
| --- | --- | --- |
| `ConsolePrimitiveFactory` | Validate primitive/options shape, exact property ownership, uniqueness, and boolean child support. | Registers every frozen declaration nominally. |
| `ConsolePrimitiveRegistry` | Distinguish package-created declarations and normalize one unique host capability list. | Shared privately by the facade and host factory. |

Properties remain exact object identities. A declaration rejects a property owned by another
primitive and rejects duplicate property identities before creating host state. A host likewise
rejects foreign declaration lookalikes and duplicate primitive identities.

Concrete session-bound `RendererPrimitiveCapability` and `RendererPropertyCapability` objects are
created only during capability resolution. They delegate state mutation to the owning logical host
session and never expose its registries or handles.
