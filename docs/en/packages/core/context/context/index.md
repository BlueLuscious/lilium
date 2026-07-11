# `Context<T>`

`Context<T>` is a portable immutable identity for a typed value resolved through the active ownership chain.

## Definition

The public [`Context.create()` API](../../api/index.md) creates a context either without a default or with one immutable default value. Creating a definition does not require a `ReactiveRuntime`, allowing libraries to export contexts as package-level objects.

An explicit provider containing `undefined` is still a found provider when `T` permits `undefined`; provider presence is not determined by truthiness or value equality.

## Providing

`context.provide(scope, value)` registers one value for that context on a scope. Registration must occur before the scope's first `run()` and may occur only once per context and scope. Duplicate or late registration throws.

The provider entry belongs to the scope and disappears during its disposal. Providing a value does not implicitly dispose that value; reactive resources already follow their own ownership registration.

## Resolution

`context.get()` starts from the active owner and walks toward the runtime root. The nearest matching scope provider wins. If no provider exists, the context default is returned. A definition without a provider or default throws a missing-context error.

Calling `get()` without an active owner can return a configured default but otherwise throws. During computed, effect, component, or renderer execution, resolution uses the owner of that consumer rather than incidental scheduler state.

Providers never cross scope trees, but the same context identity may be used independently by multiple runtimes.

## Reactivity

Context lookup is not a reactive source and does not register graph dependencies. Provider topology is setup-only. To expose a changing contextual value, provide a `Signal<T>`, `Computed<T>`, or another reactive object and read that object normally.

See [Scope](../../ownership/scope/index.md) and [Reactivity](../../reactivity/index.md).
