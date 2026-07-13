# Core API

The Core API exposes object-oriented construction without exposing concrete runtime classes. The package root exports the immutable `Runtime` and `Context` values together with their TypeScript contracts.

## `RuntimeApi`

The `Runtime` object implements `RuntimeApi`:

```ts
const runtime = Runtime.create();
```

`create()` returns a new frozen [`ReactiveRuntime`](../reactivity/reactive-runtime.md) with its own graph, scheduler, ownership root, batching coordinator, and disposal lifecycle. Runtime implementation classes are internal and have no public constructors.

The foundation exposes no scheduler configuration. Observable scheduling semantics are framework guarantees rather than per-application tuning options.

## `ContextApi`

The `Context` value implements `ContextApi`, while every created object implements the separate [`ContextIdentity<T>`](../context/context-identity/index.md) contract:

```ts
const RequiredTheme = Context.create<Theme>();
const DefaultTheme = Context.create(defaultTheme);
```

Calling `create<T>()` without an argument creates a context whose `get()` operation throws when no provider exists. Calling `create(defaultValue)` creates a context with one immutable fallback value. Context identities remain independent of any runtime and may be exported by libraries.

An explicitly passed `undefined` is a default value, not an omitted argument. This preserves the distinction between a required context and a context whose fallback is `undefined`.

## Construction decisions

- Public runtime implementation constructors are not exposed.
- `Runtime.create()` is the canonical reactive runtime construction point.
- `Context.create()` is the canonical context identity construction point.
- `Application` does not belong to Core; it requires a renderer and mounted-root lifecycle.
- Functional convenience wrappers are deferred until repeated authoring needs justify them.

## Package boundary

The JavaScript package root exports exactly `Runtime` and `Context`; all other public contracts are declaration-only exports. The package `exports` map exposes only `.` and therefore rejects deep imports into runtime, manager, engine, internal contract, and internal type files.

This boundary keeps implementation files available to the package build without turning their classes into supported consumer APIs.
