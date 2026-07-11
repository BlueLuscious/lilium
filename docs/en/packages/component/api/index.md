# Component API

The component API is the object-oriented entry point for defining headless behavior and connecting it to a reactive runtime. Its contract is declared before implementation so the public surface can be reviewed independently from concrete classes and factories.

## `ComponentApi`

The future exported `Component` object will implement `ComponentApi`. The API is stateless and exposes two operations.

### `define(definition)`

`define()` creates an immutable reusable [`ComponentDefinition`](../component/index.md). It does not execute setup, capture a runtime, create signals, or allocate an ownership scope.

Keeping definitions runtime-independent allows one definition to be reused by multiple applications, tests, renderers, and reactive runtimes.

```ts
const Counter = Component.define<CounterInputs, CounterController>({
    setup(context, inputs) {
        // Headless behavior only.
    },
});
```

The explicit generic form is the stable low-level authoring API. Contextual inference may be improved later without changing the definition ABI. The `.lily` compiler can emit a definition directly against the same contract.

### `createRuntime(runtime)`

`createRuntime()` associates component execution with one `ReactiveRuntime` and returns a [`ComponentRuntime`](../runtime/index.md). It does not transfer ownership of the supplied runtime, create a component instance, or allocate a scope.

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

The package currently exports the `ComponentApi` contract only. Exporting the concrete `Component` value is deferred until the API runtime is implemented, preventing a declaration-only value from appearing as a broken JavaScript export.
