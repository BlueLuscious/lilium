# Component Integration API

## `ComponentIntegration`

`ComponentIntegration` is the frozen object exported from `@lilium/component/integration`. It
implements [`ComponentIntegrationApi`](../contracts/component-integration-api.md) and is absent
from the root `@lilium/component` API.

`ComponentIntegration.createRuntime(runtime)` asks `CoreIntegration.assertRuntime()` to verify a
genuine live Core runtime, then returns a frozen
[`ComponentOccurrenceRuntime`](../contracts/component-occurrence-runtime.md). It borrows that
runtime and exposes no engine, runtime disposal, scheduler, tracker, or ownership manager.

Only Component Integration production sources may import `@lilium/core/integration`; architecture
tooling rejects that authority in root Component features.
