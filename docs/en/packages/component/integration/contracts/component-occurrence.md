# `ComponentOccurrence<Inputs, Controller>`

`ComponentOccurrence` is the narrow Renderer-owned capability for one initialized headless
component. It exposes:

- `instance`, the regular stable read-only [`ComponentInstance`](../../instance/index.md);
- `attachment`, a dedicated Core `Scope` beneath the private component scope;
- `updateInputs(values)`, one complete [`ComponentInputValuesType`](../../inputs/index.md) update;
- `dispose()`, idempotent disposal of attachment and component ownership.

Input updates preserve explicit `undefined` for cleared optional inputs and execute in one Core
batch. The public instance never receives this mutation authority.

The attachment scope owns template execution, reactive render bindings, nested rendered
occurrences, and host cleanup. The private component scope, mutable input store, and internal
lifecycle never escape through this contract.
