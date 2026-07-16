# Component API

The component API is the object-oriented entry point for defining headless behavior and connecting it to a reactive runtime. The package root exports its immutable `Component` value and the separate `ComponentApi` contract.

## `ComponentApi`

The exported `Component` object implements `ComponentApi`. It is frozen, stateless, and exposes two operations.

### `define(definition)`

`define()` validates the observable definition shape and creates an immutable reusable [`ComponentDefinition`](../component/index.md). It copies only the `setup` operation into a new frozen object, so it neither freezes the caller-owned object nor retains unrelated properties. It does not execute setup, capture a runtime, create signals, or allocate an ownership scope.

Keeping definitions runtime-independent allows one definition to be reused by multiple applications, tests, renderers, and reactive runtimes.

```ts
const Counter = Component.define<CounterInputs, CounterController>({
    setup(context, inputs) {
        // Headless behavior only.
    },
});
```

The explicit generic form is the stable low-level authoring API. Contextual inference may be
improved later without changing the definition ABI. The first accepted `.lily` compiler imports an
existing definition; direct Component definition generation is deferred by the
[compiler boundary](../../../architecture/lily-compiler-boundary.md).

### `createRuntime(runtime)`

`createRuntime()` associates component execution with one `ReactiveRuntime` and returns a frozen [`ComponentRuntime`](../runtime/index.md). It does not transfer ownership of the supplied runtime, create a component instance, or allocate a scope.

```ts
const components = Component.createRuntime(reactiveRuntime);
```

Applications explicitly dispose their reactive runtime. The component runtime only coordinates instances created through it.

## Object boundary

The object facade is intentional:

- it groups definition and execution entry points under the component domain;
- it avoids mutable module-level runtime state;
- it leaves component definitions as plain immutable protocol objects;
- it permits future dependency injection without changing component definitions.

Only `Component` is emitted as a JavaScript value from the package root. Contracts and type aliases remain declaration-only exports, while concrete facade, runtime, engine, lifecycle, and input classes stay behind the package export map.
