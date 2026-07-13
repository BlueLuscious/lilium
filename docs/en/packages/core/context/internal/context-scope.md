# `IContextScope`

`IContextScope` is the internal bridge implemented by concrete ownership scopes that can store context providers. It extends the public `Scope` contract without exposing provider maps, parent links, or mutable registries.

`provideContext(context, value)` enforces setup-only provider registration. `resolveContext(context)` traverses the internal ownership chain and returns `TContextResolution<T>`.

The nominal internal brand lets the Context runtime reject foreign `Scope` implementations before accessing provider storage.

See [Context](../index.md) and [`ContextIdentity<T>`](../context-identity/index.md).
