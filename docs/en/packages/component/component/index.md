# `ComponentDefinition<Inputs, Controller>`

`ComponentDefinition` is an immutable reusable object describing headless component setup behavior.

It contains one `setup` operation and no presentation. A definition may be exported by a UI library, instantiated by multiple runtimes, tested without a renderer, and later composed with one or more templates.

Programmatic definitions are declared through the [`Component.define()` API](../api/index.md). The definition itself captures no runtime and remains the stable ABI that a future `.lily` compiler may emit.

## Inputs

`Inputs` is the declarative object shape accepted by the component. Setup receives its transformed `ComponentInputsType<Inputs>`, where every key is a `ReadonlySignal`. Optional properties remain present as signals whose values include `undefined`.

## Controller

`Controller` is the object shape returned by setup and exposed to consumers or templates. Its public surface is read-only, but controller methods may update reactive state owned by the component scope.

## Setup

Setup executes exactly once per component instance inside a dedicated ownership scope. It is synchronous and cannot return a Promise. Failure follows the component scope's nearest ownership error boundary.

See [Setup](../setup/index.md), [Inputs](../inputs/index.md), [Controller](../controller/index.md), and [Instance](../instance/index.md).
