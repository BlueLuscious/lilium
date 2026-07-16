# Component Instance

A component instance is one initialized occurrence of a reusable [`ComponentDefinition`](../component/index.md). It is headless and has no mount target, host node, template, or renderer lifecycle.

## `ComponentInstance<Inputs, Controller>`

`ComponentInstance` is the public lifecycle handle created only after setup completes successfully. It exposes:

- `inputs`, the stable [`ComponentInputsType`](../inputs/index.md) object owned by the instance;
- `controller`, the read-only [`ComponentControllerType`](../controller/index.md) returned by setup;
- `disposed`, a non-reactive observation that becomes `true` when disposal begins;
- `dispose()`, the idempotent operation that disposes the internal component scope.

The ownership scope remains private. Exposing it would let consumers attach arbitrary resources to an instance and weaken the component boundary.

## Internal lifecycle

`IComponentInstanceLifecycle<Inputs, Controller>` extends the public instance only inside the component engine. Its `updateInputs(values)` operation receives a complete [`ComponentInputValuesType`](../inputs/index.md) snapshot and updates every mutable input signal in one reactive batch.

`ComponentInstanceLifecycle` is the internal mutable implementation created after setup succeeds. It retains the private `ComponentInputStore`, exposes the exact stable input object used during setup, and registers its disposal state as a component-scope cleanup.

The separate internal `ComponentInstance` class wraps that lifecycle before `ComponentRuntime.create()` returns. Its frozen public object delegates only `controller`, `inputs`, `disposed`, and `dispose()`. It has no `updateInputs` property in JavaScript, so internal mutation is erased at runtime rather than hidden only by a TypeScript contract. Its delegated disposed observation follows explicit, parent, and reactive-runtime disposal.

Renderer will not receive this internal lifecycle. The accepted
[Component integration capability](../../../architecture/rendering-integration.md#capability-shape)
will retain update authority behind a distinct adapter occurrence while exposing only this regular
read-only instance view to application and component code.

Disposal follows Core's ownership ledger in last-in-first-out order across nested scopes. The lifecycle enters its disposed state before setup cleanups execute, so it remains permanently unusable even when a cleanup failure is handled by an ownership boundary or propagates to the caller. Repeated public disposal does not execute cleanups or route the same failure again.

For example, `{ label?: string }` becomes `{ readonly label: string | undefined }`. This gives input removal an explicit representation and prevents an omitted key from ambiguously meaning either "unchanged" or "cleared".

The internal lifecycle follows these rules:

1. Create a dedicated child scope under the requesting owner.
2. Create the stable input signal object from a complete initial snapshot.
3. Run component setup exactly once with that scope active.
4. Expose the public instance only after setup returns its controller.
5. Apply each complete input snapshot in one reactive batch.
6. Dispose the component scope when the instance or its owning scope is disposed.

If setup fails, creation disposes the incomplete scope and does not expose an instance. A handled failure makes `ComponentRuntime.create()` return `undefined`; an unhandled failure propagates to its synchronous caller. Calling the internal update operation after disposal throws before reaching the input store. Explicit disposal is idempotent, and parent ownership disposal updates the same observed lifecycle state.

This contract does not define template mounting or host attachment. Those lifecycles belong to future template and renderer packages.
