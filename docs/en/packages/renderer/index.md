# `@lilium/renderer`

Status: **First public ABI and shared conformance boundary complete**

`@lilium/renderer` defines the universal execution boundary between immutable Template programs,
Core scheduling and ownership, Component occurrences, and target-specific host adapters. It
depends on `@lilium/core`, `@lilium/component`, and `@lilium/template` without depending on any
browser, console, server, or native implementation.

The package publishes the frozen `Renderer` facade together with host, runtime, and mounted
application contracts. Private runtime foundations own sessions, capability preflight, detached
construction, reactive bindings, Components, slots, explicit placement, and terminal cleanup.

## Features

- [API](api/index.md) defines the final object-oriented runtime construction boundary.
- [Application](application/index.md) defines public mounted root lifecycle handles.
- [Host](host/index.md) defines adapters, sessions, capabilities, and opaque placement metadata.
- [Session](session/index.md) implements exclusive root claims and terminal host-session ownership.
- [Preflight](preflight/index.md) implements projection-aware requirement collection and validation.
- [Execution](execution/index.md) implements primitives, bindings, Components, slots, and occurrences.
- [Runtime](runtime/index.md) defines standalone Template and templated Component mount operations.
- [Error](error/index.md) defines compatibility and synchronous protocol failure representations.
- [Shared](shared/index.md) documents the internal cross-feature cleanup collector.
- [Conformance](conformance/index.md) exposes reusable host-neutral scenarios through a developer subpath.

## Source structure

```text
src/
  api/
    contracts/
    renderer.api.ts
  application/
    contracts/
    runtime/
  conformance/
    contracts/
    runtime/
    types/
  host/
    contracts/
    runtime/
    types/
  session/
    runtime/
    types/internal/
  preflight/
    runtime/
    types/internal/
  execution/
    contracts/internal/
    runtime/
    types/internal/
  runtime/
    contracts/
    types/
    renderer-runtime.ts
  shared/
    runtime/
  error/
    contracts/
    runtime/
    types/
  index.ts
```

The package root exposes `Renderer` plus its supported contracts and types. The separate
`@lilium/renderer/conformance` developer subpath exposes reusable scenario contracts and the frozen
`RendererConformance` facade without adding values to the root. Concrete runtime,
mounted-handle, session, preflight, execution, and cleanup classes remain private implementation
details. The package has no host implementation, mutable virtual tree, DOM type, or compiler
behavior. Canonical execution and lifecycle semantics are defined once by the
[Renderer Protocol](../../architecture/renderer-protocol.md).

The compiled package is tested through its declared export map. Only the frozen `Renderer` value
exists at runtime at the package root; only `RendererConformance` exists at the conformance
subpath. Public contracts and types remain erased TypeScript API.

## Dependency boundary

Renderer may consume public Core, Component, and Template roots. Runtime implementation phases may
also consume the explicitly authorized `@lilium/core/integration` and
`@lilium/component/integration` bridges. No lower-level package imports Renderer, and host adapters
depend toward Renderer rather than becoming its dependencies.
