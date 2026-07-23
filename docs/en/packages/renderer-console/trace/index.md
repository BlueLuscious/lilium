# Renderer Console Trace

Status: **Implemented**

Trace is a private diagnostic observation of the public Renderer host protocol. It records accepted
operation attempts and successful completions without retaining external roots, Template
identities, property candidates, timestamps, process data, or platform values.

## Types

| Type | Responsibility | Relationships |
| --- | --- | --- |
| `ConsoleTraceEntryType` | Represent one immutable serializable operation stage with normalized numeric identities. | Returned by `ConsoleHost.trace()` and identifies a public `RendererHostOperationType`. |
| `ConsoleTraceStatusType` | Distinguish `attempted` from `completed`. | A failed operation has an attempted entry without its matching completion. |
| `TConsoleTracePayload` | Represent an internal entry before sequence and status enrichment. | Consumed only by `ConsoleTraceRecorder`. |

## Runtime Concepts

| Concept | Responsibility | Relationships |
| --- | --- | --- |
| `ConsoleTraceRecorder` | Append frozen entries and return frozen ordered snapshots. | One recorder is created for every root opening attempt and retained by `ConsoleHost`. |
| `ConsoleIdentityRegistry` | Normalize primitive and property object identities into deterministic session-local numbers. | Seeds identities from declaration and property order; value identities come from `ConsoleHostSession`. |

## Entry Model

Every entry contains a zero-based `sequence`, `status`, and `operation`. Optional fields identify
only the logical participants relevant to that operation:

- `root` is zero for session open and close;
- `primitive` and `property` follow normalized capability declaration order;
- `value` starts at one and follows creation attempt order;
- `parent`, `before`, and `currentParent` describe placement and removal using handle identifiers;
- `before` and `currentParent` use `null` for an absent sibling or detached value.

The recorder appends `attempted` after operation arguments and host invariants are validated but
before injected failure or mutation. It appends `completed` only after successful mutation or
resolution. Capability omission is a successful resolution to `undefined`, so it has both stages.
A repeated idempotent close performs no operation and creates no additional entry.

Opening the same root after terminal closure starts a new session-local trace. Identical capability
configuration and operation scenarios therefore produce byte-equivalent JSON traces.

The universal operation and atomicity rules remain canonical in the
[Renderer Protocol](../../../architecture/renderer-protocol.md). Failure scheduling is documented
by [Failure](../failure/index.md).
