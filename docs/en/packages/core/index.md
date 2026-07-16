# `@lilium/core`

Status: **Runtime implemented**

`@lilium/core` provides the target-independent execution foundation for Lilium. It does not contain DOM operations, template host operations, virtual nodes, component-wide render loops, global reducers, or action dispatching.

## Features

| Feature | Responsibility |
| --- | --- |
| [`api`](api/index.md) | Object-oriented runtime and context construction boundaries. |
| [`reactivity`](reactivity/index.md) | Signals, computed values, effects, dependency tracking, and batching. |
| [`ownership`](ownership/index.md) | Resource scopes, parent-child ownership, cleanup, and recursive disposal. |
| [`scheduler`](scheduler/index.md) | Deterministic render/effect phases, queues, deduplication, and reentry control. |
| [`context`](context/index.md) | Portable typed identities and values resolved through ownership. |
| [`integration`](integration/index.md) | Narrow Renderer-facing render-binding contracts kept outside the package root. |

Headless component definitions live in `@lilium/component`, while visual definitions and component-template composition belong to the future `@lilium/template`. Core remains independent from both protocols.

## Source structure

```text
src/
  api/
    contracts/
  reactivity/
    contracts/
      internal/
    types/
      internal/
    runtime/
  ownership/
    contracts/
      internal/
    types/
      internal/
    runtime/
  scheduler/
    contracts/
      internal/
    types/
      internal/
    runtime/
  context/
    contracts/
      internal/
    types/
      internal/
    runtime/
  integration/
    api/
    contracts/
    types/
    runtime/
  index.ts
```

Folders are created only when they contain a required concept. Empty architectural placeholders are avoided.

Read-only inspection remains future work and will be added only when runtime tests or development tools establish concrete requirements.

See the [Core API](api/index.md) for package construction and export boundaries.
