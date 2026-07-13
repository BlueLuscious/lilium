# Ownership

Status: **Runtime implemented**

Ownership provides deterministic lifetime boundaries for reactive resources, future component instances, renderer bindings, contextual values, and user cleanups.

## Compositions

- [Scope](scope/index.md) defines explicit parent-child ownership and recursive disposal.
- [Error Boundary](error-boundary/index.md) defines nearest-owner error handling and propagation.
- [Ownership Runtime](runtime/index.md) implements ledgers, active owners, recovery, and disposal.

## Runtime relationship

A `ReactiveRuntime` is the root owner for its resources and root scopes. A scope becomes the active owner only while executing `Scope.run()`. Reactive resources created without an active scope belong directly to the runtime.

Ownership state and stacks are internal. Public objects expose explicit creation, execution, cleanup registration, and disposal without mutable child or resource collections.

Component integration belongs to `@lilium/component`. Renderer ownership remains deferred with the renderer package.

## Deferred concepts

- Read-only ownership inspection.
