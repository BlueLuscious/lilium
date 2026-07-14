# Component Runtime

The component runtime is the public object responsible for turning a reusable [`ComponentDefinition`](../component/index.md) into an initialized [`ComponentInstance`](../instance/index.md). It coordinates headless behavior and ownership only.

## `ComponentRuntime`

`ComponentRuntime.create(definition, options)` synchronously creates one component instance in its associated `ReactiveRuntime`.

Creation requires [`ComponentCreateOptionsType`](#componentcreateoptionstypeinputs) and returns either the initialized instance or `undefined`. `undefined` means setup failed and the nearest ownership error boundary handled that failure. An unhandled failure propagates to the synchronous caller without exposing a partial instance.

The concrete internal `ComponentRuntime` stores one reactive runtime and the private creation engine, then freezes itself. Its construction performs no scope allocation. It exposes no runtime disposal operation and never owns or disposes the supplied reactive runtime.

Programmatic consumers obtain this object through [`Component.createRuntime()`](../api/index.md). Each successful engine result is wrapped in the protected public object described by [Component Instance](../instance/index.md); the mutable lifecycle never crosses the JavaScript package boundary.

## `ComponentCreateOptionsType<Inputs>`

Creation options contain:

- `inputs`, one complete [`ComponentInputValuesType`](../inputs/index.md) snapshot;
- `owner`, the `Scope` that owns the new component scope.

The owner must belong to the same reactive runtime as the component runtime. A mismatched owner is invalid and must throw before setup executes.

## Internal engine

`IComponentEngine` is the private creation bridge used by the public runtime. The frozen internal `componentEngine` object implements this contract, receives the reactive runtime explicitly, and returns an `IComponentInstanceLifecycle` internally. `ComponentRuntime` converts that result into a public instance instead of exposing or casting the lifecycle.

The engine performs creation atomically:

1. Validate the observable definition and options shapes before creating ownership.
2. Ask Core to validate the explicit owner and create a child component scope.
3. Create every mutable input signal while that child scope is active.
4. Run setup exactly once with a frozen setup context and stable read-only inputs.
5. Reject non-object and Promise-like controller results inside the owned setup execution.
6. Return the initialized lifecycle only after setup succeeds.
7. Dispose the incomplete child scope if creation aborts.

Runtime validation cannot reconstruct erased generic keys. It verifies that definitions, options, inputs, owners, and controllers have the supported observable forms; complete input keys are established by the normalized initial snapshot. Core remains responsible for proving that the owner is a live scope from the same reactive runtime.

When setup failure is handled by an ownership boundary, scoped execution returns without a controller. The engine disposes the incomplete scope and returns `undefined`. A propagated failure is rethrown unchanged after successful cleanup. If incomplete cleanup also propagates a failure, the engine throws one `AggregateError` containing the creation failure first and the disposal failure second.

Input updates and disposal follow the [Component Instance](../instance/index.md) lifecycle. Template mounting and host attachment remain outside this package.
