# Renderer Console Host

Status: **Private host lifecycle and observations implemented**

## Contracts And Types

| Contract or type | Responsibility | Relationships |
| --- | --- | --- |
| `ConsoleHost` | Extend public `RendererHost` with read-only snapshot and structured trace observations for workspace tests. | Opens `ConsoleHostSession`; returned by `RendererConsole.createHost()`; links to [Trace](../trace/index.md). |
| `ConsoleRootSnapshot` | Observe one active external root and its ordered logical children. | Contains recursive `ConsoleValueSnapshot` values. |
| `ConsoleValueSnapshot` | Observe one value identifier, primitive, properties, and descendants. | Built from private handle records without exposing mutation authority. |
| `ConsoleHandleType` | Represent one opaque nominal parent/value identity. | Used as both Renderer `Parent` and `Value`. |
| `ConsoleHostOptionsType` | Supply primitive declarations, optional capability omissions, and optional operation failures. | Consumed by `RendererConsole.createHost()`; references [Failure](../failure/index.md). |
| `ConsolePrimitiveType` | Derive the accepted primitive identity from public Renderer session contracts. | Avoids a production Template dependency. |
| `ConsolePropertyType<Primitive>` | Represent the structural public property identity for one primitive. | Used by declarations, capabilities, and snapshots. |
| `ConsolePropertySnapshotType` | Observe the latest candidate for one exact property identity. | Contained by `ConsoleValueSnapshot`. |
| `ConsoleRootType` | Represent an externally owned object root with an optional diagnostic name. | Exact object identity controls exclusive claims. |
| `TConsoleHandleRecord` | Retain mutable private tree, property, attachment, and release state. | Keyed only by opaque handles inside one session. |
| `TConsoleSessionState` | Represent the irreversible private session lifecycle. | `open` or `closed`. |

## Runtime Concepts

| Concept | Responsibility | Relationships |
| --- | --- | --- |
| `ConsoleHost` | Own immutable capabilities, active root claims, and retained trace ledgers. | Implements the public host contract and returns frozen observation copies. |
| `ConsoleHostSession` | Own one logical tree, handle registry, capability adapters, protocol validation, and terminal closure. | Implements public `RendererHostSession`. |
| `ConsoleHandle` | Provide a frozen fieldless identity for one root parent or primitive value. | All mutable state remains in the session map. |

## Lifecycle

1. The host claims an exact external root and creates root handle identifier zero.
2. Preflight resolves configured primitive and property identities without creating values.
3. Primitive capabilities create detached handles with deterministic identifiers starting at one.
4. Property writes replace the latest candidate for the exact supported property.
5. Placement validates ownership, current attachment, parent capability, anchor membership, and
   cycle freedom before changing child sequences.
6. Removal detaches an immediate child without releasing it.
7. Release accepts only a detached empty value created by the matching capability.
8. Closure requires every value to be released, becomes idempotently terminal, and releases the
   host-root claim.

Snapshots recursively copy only active logical state and freeze every returned collection.
Structured traces remain available after closure and distinguish attempted from completed
operations. Their identity and serialization rules are defined by [Trace](../trace/index.md).
Failure configuration and terminal cleanup exceptions are defined by
[Failure](../failure/index.md).
