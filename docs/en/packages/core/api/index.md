# Core API

The Core API declares object-oriented construction without exposing concrete runtime classes. The package will export immutable `Runtime` and `Context` values when their implementations exist; this foundation currently exports only their contracts.

## `RuntimeApi`

The future `Runtime` object implements `RuntimeApi`:

```ts
const runtime = Runtime.create();
```

`create()` returns a new isolated [`ReactiveRuntime`](../reactivity/reactive-runtime.md) with its own graph, scheduler, ownership root, and context resolution state. Runtime implementation classes are internal and have no public constructors.

The foundation exposes no scheduler configuration. Observable scheduling semantics are framework guarantees rather than per-application tuning options.

## `ContextApi`

The future `Context` value implements `ContextApi` while `Context<T>` remains the instance contract in TypeScript's separate type namespace:

```ts
const RequiredTheme = Context.create<Theme>();
const DefaultTheme = Context.create(defaultTheme);
```

Calling `create<T>()` without an argument creates a context whose `get()` operation throws when no provider exists. Calling `create(defaultValue)` creates a context with one immutable fallback value. Context identities remain independent of any runtime and may be exported by libraries.

## Construction decisions

- Public runtime implementation constructors are not exposed.
- `Runtime.create()` is the canonical reactive runtime construction point.
- `Context.create()` is the canonical context identity construction point.
- `Application` does not belong to Core; it requires a renderer and mounted-root lifecycle.
- Functional convenience wrappers are deferred until repeated authoring needs justify them.

Only the API contracts are exported today. Runtime values are added together with their implementations so JavaScript exports never point to declaration-only objects.
