# Component Instance

A component instance is one initialized occurrence of a reusable [`ComponentDefinition`](../component/index.md). It is headless and has no mount target, host node, template, or renderer lifecycle.

## `ComponentInstance<Inputs, Controller>`

`ComponentInstance` is the public lifecycle handle created only after setup completes successfully. It exposes:

- `inputs`, the stable [`ComponentInputsType`](../inputs/index.md) object owned by the instance;
- `controller`, the read-only [`ComponentControllerType`](../controller/index.md) returned by setup;
- `disposed`, a non-reactive lifecycle observation;
- `dispose()`, the idempotent operation that disposes the internal component scope.

The ownership scope remains private. Exposing it would let consumers attach arbitrary resources to an instance and weaken the component boundary.

## Internal lifecycle

`IComponentInstanceLifecycle<Inputs, Controller>` extends the public instance only inside the component engine. Its `updateInputs(values)` operation receives a complete normalized snapshot and updates every mutable input signal in one reactive batch.

`TComponentInputValues<Inputs>` makes every input key required while preserving `undefined` in optional value types. For example, `{ label?: string }` becomes `{ readonly label: string | undefined }`. This gives input removal an explicit representation and prevents an omitted key from ambiguously meaning either "unchanged" or "cleared".

The internal lifecycle follows these rules:

1. Create a dedicated child scope under the requesting owner.
2. Create the stable input signal object from a complete initial snapshot.
3. Run component setup exactly once with that scope active.
4. Expose the public instance only after setup returns its controller.
5. Apply each complete input snapshot in one reactive batch.
6. Dispose the component scope when the instance or its owning scope is disposed.

If setup fails, creation disposes the incomplete scope and does not expose an instance. Error handling follows the nearest ownership error boundary. Calling the internal update operation after disposal is an invalid lifecycle transition and must throw when runtime behavior is implemented.

This contract does not define template mounting or host attachment. Those lifecycles belong to future template and renderer packages.
