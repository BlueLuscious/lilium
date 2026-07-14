# Component Setup

Component setup initializes one headless instance exactly once.

## `ComponentSetupContext`

`ComponentSetupContext` exposes the `ReactiveRuntime` and dedicated component `Scope`. The scope is active during setup, so created signals, computed values, effects, child scopes, and cleanups belong to the component instance.

Context definitions resolve through the active component scope using their own `get()` methods.

## `ComponentSetupFunctionType<Inputs, Controller>`

The setup function receives `ComponentSetupContext` and `ComponentInputsType<Inputs>`, then returns `ComponentControllerType<Controller>` synchronously.

The creation engine validates the returned runtime value before exposing an instance. Setup must return a non-array controller object; `null`, primitives, and Promise-like objects are rejected as owned setup failures and follow normal error-boundary propagation.

Setup does not receive a renderer, template, host node, mount target, or DOM lifecycle. Visual composition belongs to `@lilium/template` and execution belongs to `@lilium/renderer`.

See [Component](../component/index.md).
