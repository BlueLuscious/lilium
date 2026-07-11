# Component Runtime

The component runtime is the public object responsible for turning a reusable [`ComponentDefinition`](../component/index.md) into an initialized [`ComponentInstance`](../instance/index.md). It coordinates headless behavior and ownership only.

## `ComponentRuntime`

`ComponentRuntime.create(definition, options)` synchronously creates one component instance in its associated `ReactiveRuntime`.

Creation requires [`ComponentCreateOptionsType`](#componentcreateoptionstypeinputs) and returns either the initialized instance or `undefined`. `undefined` means setup failed and the nearest ownership error boundary handled that failure. An unhandled failure propagates to the synchronous caller without exposing a partial instance.

The component runtime does not own or dispose the reactive runtime supplied when its future API object is created.

## `ComponentCreateOptionsType<Inputs>`

Creation options contain:

- `inputs`, one complete [`ComponentInputValuesType`](../inputs/index.md) snapshot;
- `owner`, the `Scope` that owns the new component scope.

The owner must belong to the same reactive runtime as the component runtime. A mismatched owner is invalid and must throw before setup executes.

## Internal engine

`IComponentEngine` is the private creation bridge used by the public runtime. It receives the reactive runtime explicitly and returns an `IComponentInstanceLifecycle` internally. The mutable lifecycle is erased before the instance reaches consumers.

The engine must perform creation atomically:

1. Validate the owner and initial snapshot before setup.
2. Create a child component scope.
3. Create every mutable input signal from the normalized snapshot.
4. Run setup once with the child scope active.
5. Return the initialized lifecycle only after setup succeeds.
6. Dispose the incomplete child scope if setup aborts.

Input updates and disposal follow the [Component Instance](../instance/index.md) lifecycle. Template mounting and host attachment remain outside this package.
