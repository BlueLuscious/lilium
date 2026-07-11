# Context

Status: **Foundation accepted**

Context provides portable typed identities whose values are stored by ownership scopes and resolved through their parent chain.

## Compositions

- [`Context<T>`](context/index.md) defines provider registration and nearest-value resolution.
- [`IContextScope`](internal/context-scope.md) bridges context identities to internal scope storage.
- [`TContextResolution<T>`](internal/context-resolution.md) distinguishes absent providers from provided `undefined` values.

## Portability

A context definition does not belong to one `ReactiveRuntime`. A component or UI library may export one immutable context object and use it across multiple applications. Each scope tree stores independent provider values for that shared identity.

The public [`Context.create()` API](../api/index.md) creates context definitions without requiring a runtime instance.

## Deferred concepts

- Context inspection for development tools.

Missing context reads throw a standard `Error`; no public error subclass or stable message is part of the foundation contract.
