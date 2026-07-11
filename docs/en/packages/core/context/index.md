# Context

Status: **In design**

Context provides portable typed identities whose values are stored by ownership scopes and resolved through their parent chain.

## Compositions

- [`Context<T>`](context/index.md) defines provider registration and nearest-value resolution.

## Portability

A context definition does not belong to one `ReactiveRuntime`. A component or UI library may export one immutable context object and use it across multiple applications. Each scope tree stores independent provider values for that shared identity.

The concrete factory for creating context definitions belongs to the future public `api/` phase. The contract intentionally does not require a runtime instance for construction.

## Deferred concepts

- Public context definition factory and optional naming.
- Missing-context error contract.
- Internal scope provider registry and resolver bridge.
- Context inspection for development tools.
