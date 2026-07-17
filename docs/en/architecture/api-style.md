# API Style

Status: **Foundation accepted**

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

## Foundation public objects

| Object | Responsibility |
| --- | --- |
| `ReactiveRuntime` | Owns reactive execution policy and creates root scopes. |
| `Scope` | Owns resources and controls recursive disposal. |
| `Signal<T>` | Stores a reactive value and exposes tracked reads and writes. |
| `Computed<T>` | Exposes a derived reactive value. |
| `Effect` | Represents a disposable side effect. |
| `ContextIdentity<T>` | Identifies an owned contextual value. |
| `ComponentDefinition<Inputs, Controller>` | Immutable reusable headless component definition. |
| `ComponentInstance<Inputs, Controller>` | Owns one initialized headless component occurrence. |
| `ComponentRuntime` | Creates component instances in one reactive runtime. |
| `TemplateDefinition<State>` | Owns one immutable target-independent template program. |
| `TemplatePrimitive<Properties>` | Identifies one portable host capability. |
| `TemplateProperty<Primitive, Value>` | Identifies one typed primitive value capability. |
| `TemplateSlot<Inputs>` | Identifies one typed visual projection point. |
| `TemplatedComponentDefinition<Inputs, Controller>` | Composes headless behavior with one compatible template. |
| `RendererRuntime` | Executes Template programs through one reactive runtime and host adapter. |
| `RenderedApplication` | Owns one mounted root lifecycle and host session. |
| `RenderedComponent<Inputs, Controller>` | Exposes one mounted component and complete root-input updates. |
| `RenderedTemplate<State>` | Exposes one mounted standalone template and its stable state. |

The immutable `Runtime`, `Context`, `Component`, and `Template` facade objects are the canonical
construction boundaries. Core and Component concrete values are exported only with their runtime
implementations; Template exports immutable declaration behavior without an execution runtime.

The implemented Template object model is defined in [Template ABI](template-abi.md). The future
Renderer object model remains accepted in [Renderer Protocol](renderer-protocol.md). A higher-level
browser-oriented `Application` facade remains a future package concept and does not belong to
`@lilium/core`.

## Encapsulation

Public objects should normally be interfaces or opaque handles. Runtime classes may implement them internally, but consumers must not depend on concrete implementation classes unless construction or extension explicitly requires it.

Mutable collections and graph nodes must not be exposed directly. Inspection APIs return immutable snapshots or event records.

Runtime classes use native `#` fields and methods for state and behavior that are not extension points. This preserves encapsulation in emitted JavaScript rather than enforcing it only through TypeScript. `private constructor` is reserved for TypeScript-controlled construction because JavaScript has no private-constructor syntax; package exports and facade factories provide the corresponding runtime construction boundary.

`protected` members are reserved for intentionally supported inheritance points. Lilium otherwise prefers contracts and composition over subclass access to runtime internals.

## Convenience APIs

Composable functions may be added where they improve authoring ergonomics, but they delegate to the object model and do not define separate semantics. The object API remains the canonical extension and lifecycle model.

## Accepted reactive value API

Reactive values use explicit object methods:

- `get()` performs a tracked read.
- `set(value)` replaces the current value and returns nothing.
- `update(updater)` derives the next value from the latest value and returns nothing.

Signals are created by a `ReactiveRuntime`; their concrete implementation classes are not public construction points. A mutable `Signal<T>` is assignable to a `ReadonlySignal<T>` so consumers can receive read access without write access.

## Construction decisions

- Consumers create opaque runtime objects through immutable object facades, not public implementation constructors.
- `Runtime.create()` creates an isolated `ReactiveRuntime`.
- `Context.create()` creates portable context identities.
- `Component.define()` and `Component.createRuntime()` define and execute headless components.
- `Template` creates immutable primitive, property, slot, template, and component-template
  definitions without capturing runtime state.
- `Renderer.createRuntime()` creates a configured `RendererRuntime`; its mount operations return
  owned rendered-application handles.
- Convenience composables are deferred until concrete authoring repetition justifies them.
- Public contracts are extension protocols only when third-party implementation is intentional; otherwise concrete implementations remain opaque.
