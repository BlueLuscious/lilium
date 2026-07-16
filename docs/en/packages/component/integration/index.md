# Component Integration

Status: **Runtime implemented**

`@lilium/component/integration` is a supported adapter-facing subpath for Renderer. It is absent
from the `@lilium/component` package root and does not enlarge the normal headless Component API.

## Contracts

- [`ComponentIntegrationApi`](contracts/component-integration-api.md) binds occurrence creation to one genuine Core runtime.
- [`ComponentOccurrenceRuntime`](contracts/component-occurrence-runtime.md) creates initialized adapter occurrences.
- [`ComponentOccurrence`](contracts/component-occurrence.md) retains complete input updates and attachment ownership.

## Runtime

- [`ComponentIntegration`](api/index.md) validates and connects one genuine Core runtime.
- [Component occurrence runtime](runtime/index.md) reuses atomic setup and protects mutable lifecycle authority.

The subpath exposes no component engine, input store, mutable signal, private component scope, or
internal lifecycle implementation. Its authority and ownership topology are defined by
[Rendering Integration](../../../architecture/rendering-integration.md).
