# `@lilium/renderer-console`

Status: **Deterministic tracing and failure injection implemented**

`@lilium/renderer-console` is workspace-only conformance infrastructure. It implements the public
Renderer host protocol with logical object handles and deterministic in-memory state, proving that
the universal runtime does not depend on its internal test fixture or a target platform.

The package name describes its diagnostic role. It does not write to the JavaScript console,
render ANSI output, provide terminal widgets, or define an end-user API.

## Features

- [API](api/index.md) exposes the frozen private construction facade.
- [Capability](capability/index.md) declares immutable primitive and property support.
- [Host](host/index.md) owns root sessions, opaque handles, logical trees, and snapshots.
- [Trace](trace/index.md) records deterministic attempted and completed protocol stages.
- [Failure](failure/index.md) configures capability omissions and exact operation failures.

## Source Structure

```text
src/
  api/
    contracts/
    renderer-console.api.ts
  capability/
    contracts/
    runtime/
    types/
  failure/
    runtime/
    types/
  host/
    contracts/
    runtime/
    types/
      internal/
  trace/
    runtime/
    types/
      internal/
  index.ts
```

Production sources import only the public `@lilium/renderer` package root. Core and Template are
development-only dependencies used to execute integration tests. Package metadata sets
`private: true`, and architecture tooling rejects publication, extra package subpaths, host ambient
types, or production dependencies other than Renderer.

The accepted universal behavior remains documented by the
[Renderer Protocol](../../architecture/renderer-protocol.md). This package observes that protocol
without adding target-specific branches to Renderer. Shared scenario reuse remains the next
conformance phase.
