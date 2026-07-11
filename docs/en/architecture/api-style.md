# API Style

Status: **Draft**

## Decision rule

Lilium uses objects when a concept has at least one of these properties:

- Stable identity.
- Mutable state guarded by invariants.
- Configuration shared by multiple operations.
- Ownership or disposal.
- Runtime inspection.
- An extension contract implemented by third parties.

Functions are used for:

- Pure transformations.
- Callbacks and user-provided behavior.
- One-shot operations.
- Optional convenience wrappers around the canonical object API.

## Proposed public objects

| Object | Responsibility |
| --- | --- |
| `ReactiveRuntime` | Owns reactive execution policy and creates root scopes. |
| `Scope` | Owns resources and controls recursive disposal. |
| `Signal<T>` | Stores a reactive value and exposes tracked reads and writes. |
| `Computed<T>` | Exposes a derived reactive value. |
| `Effect` | Represents a disposable side effect. |
| `Context<T>` | Identifies an owned contextual value. |
| `ComponentDefinition<P>` | Immutable reusable component definition. |
| `TemplateDefinition` | Immutable target-independent template and binding description. |
| `Renderer` | Instantiates templates using a host implementation. |
| `Application` | Owns a mounted root, root scope, renderer, and disposal boundary. |

These names are proposals. Their responsibilities must be approved before signatures are created.

## Encapsulation

Public objects should normally be interfaces or opaque handles. Runtime classes may implement them internally, but consumers must not depend on concrete implementation classes unless construction or extension explicitly requires it.

Mutable collections and graph nodes must not be exposed directly. Inspection APIs return immutable snapshots or event records.

## Convenience APIs

Composable functions may be added where they improve authoring ergonomics, but they delegate to the object model and do not define separate semantics. The object API remains the canonical extension and lifecycle model.

## Accepted reactive value API

Reactive values use explicit object methods:

- `get()` performs a tracked read.
- `set(value)` replaces the current value and returns nothing.
- `update(updater)` derives the next value from the latest value and returns nothing.

Signals are created by a `ReactiveRuntime`; their concrete implementation classes are not public construction points. A mutable `Signal<T>` is assignable to a `ReadonlySignal<T>` so consumers can receive read access without write access.

## Open decisions

- Whether users construct runtime objects directly or through static factories.
- Whether an `Application` receives an existing runtime or creates an isolated runtime by default.
- Which objects are public extension points and which are opaque handles.
