# `@lilium/renderer`

Status: **Public protocol declared; sessions and preflight implemented**

`@lilium/renderer` defines the universal execution boundary between immutable Template programs,
Core scheduling and ownership, Component occurrences, and target-specific host adapters. It
depends on `@lilium/core`, `@lilium/component`, and `@lilium/template` without depending on any
browser, console, server, or native implementation.

The package currently publishes type-only protocol surfaces. Phase 01 implements private session
ownership and capability preflight; the concrete frozen `Renderer` facade remains intentionally
absent until instruction execution, integration, and terminal cleanup have real implementations.

## Features

- [API](api/index.md) defines the final object-oriented runtime construction boundary.
- [Application](application/index.md) defines public mounted root lifecycle handles.
- [Host](host/index.md) defines adapters, sessions, capabilities, and opaque placement metadata.
- [Session](session/index.md) implements exclusive root claims and terminal host-session ownership.
- [Preflight](preflight/index.md) implements projection-aware requirement collection and validation.
- [Runtime](runtime/index.md) defines standalone Template and templated Component mount operations.
- [Error](error/index.md) defines compatibility and synchronous protocol failure representations.

## Source structure

```text
src/
  api/
    contracts/
  application/
    contracts/
  host/
    contracts/
    types/
  session/
    runtime/
    types/internal/
  preflight/
    runtime/
    types/internal/
  runtime/
    contracts/
    types/
  error/
    contracts/
    runtime/
    types/
  index.ts
```

The package root currently exposes contracts and types only. Session and preflight classes are
private implementation details and no public runtime value exists yet. The package has no host
implementation, mutable virtual tree, DOM type, or compiler behavior. Canonical execution and
lifecycle semantics are defined once by the
[Renderer Protocol](../../architecture/renderer-protocol.md).

## Dependency boundary

Renderer may consume public Core, Component, and Template roots. Runtime implementation phases may
also consume the explicitly authorized `@lilium/core/integration` and
`@lilium/component/integration` bridges. No lower-level package imports Renderer, and host adapters
depend toward Renderer rather than becoming its dependencies.
