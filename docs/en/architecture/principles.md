# Architecture Principles

Status: **Foundation accepted**

## Framework identity

Lilium uses fine-grained dependency tracking, but its public model is not intended to reproduce another framework's API. Its identity is based on stable objects, explicit ownership, deterministic update phases, portable compiled templates, and renderer capabilities.

## Principles

### Fine-grained updates

A state change invalidates only the computations and template bindings that observed that state. Components do not rebuild a virtual tree after every change.

### Objects represent identity

Long-lived concepts with identity, state, configuration, or disposal are exposed as objects. Examples include applications, signals, computed values, effects, scopes, contexts, component definitions, templates, and renderers.

Functions remain appropriate for pure transformations, short-lived operations, callbacks, and optional convenience APIs.

See [API Style](api-style.md).

### Explicit ownership

Every resource belongs either to the runtime root owner or to an explicit scope. Disposing an owner recursively disposes computations, effects, component instances, renderer bindings, child scopes, and registered cleanups.

### Deterministic propagation

Reactive propagation follows documented phases. Batching and nested updates must not make execution order unpredictable.

### Portable component definitions

A component definition is an immutable object that can be exported by a package, consumed as a dependency, and instantiated more than once. It does not expose mutable runtime instance state.

### Templates without a virtual DOM

A template describes stable structure and dynamic binding points. A renderer instantiates the stable structure once and updates only affected bindings.

See [Template ABI](template-abi.md).

### Compiler-independent semantics

The `.lily` compiler may optimize templates, but compiled and programmatically-created definitions must obey the same public contracts. Compiler optimizations must not change observable behavior.

See [Lily Compiler Boundary](lily-compiler-boundary.md).

### Target independence

Core reactivity and ownership do not depend on DOM APIs. Templates depend on an abstract renderer protocol. Target-specific behavior belongs to a renderer adapter.

Target independence concerns host APIs rather than JavaScript language compatibility. See [Distribution](distribution.md) for the accepted module and ECMAScript baseline.

### Observable internals without public mutation

Internal instrumentation may expose read-only events and snapshots for tests and future development tools. It must not permit external mutation of the reactive graph.

## Non-goals for the foundation

- A virtual DOM or component-wide rerender loop.
- A global reducer or action dispatcher in the framework core.
- DOM knowledge in the reactive runtime.
- Requiring the `.lily` compiler for semantic correctness.
- Stabilizing router, server rendering, or development tools before the client MVP.
