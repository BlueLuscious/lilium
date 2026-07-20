# `@lilium/renderer`

Status: **Public protocol declared; runtime pending**

`@lilium/renderer` defines the universal execution boundary between immutable Template programs,
Core scheduling and ownership, Component occurrences, and target-specific host adapters. It
depends on `@lilium/core`, `@lilium/component`, and `@lilium/template` without depending on any
browser, console, server, or native implementation.

Phase 00 publishes type-only protocol surfaces. The concrete frozen `Renderer` facade and runtime
behavior remain intentionally absent until sessions, execution, integration, and terminal cleanup
have real implementations.

## Features

- [API](api/index.md) defines the final object-oriented runtime construction boundary.
- [Application](application/index.md) defines public mounted root lifecycle handles.
- [Host](host/index.md) defines adapters, sessions, capabilities, and opaque placement metadata.
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
  runtime/
    contracts/
    types/
  error/
    contracts/
    types/
  index.ts
```

The package root currently exposes contracts and types only. It has no runtime value, internal
execution class, host implementation, mutable virtual tree, DOM type, or compiler behavior. The
canonical execution and lifecycle semantics are defined once by the
[Renderer Protocol](../../architecture/renderer-protocol.md).

## Dependency boundary

Renderer may consume public Core, Component, and Template roots. Runtime implementation phases may
also consume the explicitly authorized `@lilium/core/integration` and
`@lilium/component/integration` bridges. No lower-level package imports Renderer, and host adapters
depend toward Renderer rather than becoming its dependencies.
