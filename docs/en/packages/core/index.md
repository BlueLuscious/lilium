# `@lilium/core`

Status: **Foundation accepted**

`@lilium/core` will provide the target-independent execution foundation for Lilium. It will not contain DOM operations, template host operations, virtual nodes, component-wide render loops, global reducers, or action dispatching.

## Features

| Feature | Responsibility |
| --- | --- |
| [`api`](api/index.md) | Object-oriented runtime and context construction boundaries. |
| [`reactivity`](reactivity/index.md) | Signals, computed values, effects, dependency tracking, and batching. |
| [`ownership`](ownership/index.md) | Resource scopes, parent-child ownership, cleanup, and recursive disposal. |
| [`scheduler`](scheduler/index.md) | Deterministic render/effect phases, queues, deduplication, and reentry control. |
| [`context`](context/index.md) | Portable typed identities and values resolved through ownership. |

Headless component definitions live in `@lilium/component`, while visual definitions and component-template composition belong to the future `@lilium/template`. Core remains independent from both protocols.

## Source structure

```text
src/
  reactivity/
    api/
    contracts/
      internal/
    types/
      internal/
    runtime/
  ownership/
    api/
    contracts/
      internal/
    types/
      internal/
    runtime/
  scheduler/
    api/
    contracts/
      internal/
    types/
      internal/
    runtime/
  context/
    api/
    contracts/
      internal/
    types/
      internal/
    runtime/
  index.ts
```

Folders are created only when they contain a required concept. Empty architectural placeholders are avoided.

Read-only inspection remains future work and will be added only when runtime tests or development tools establish concrete requirements.

See the [Foundation Epic](../../../../plans/epics/000-framework-foundation/index.md) for implementation planning.
