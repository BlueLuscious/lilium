# `@lilium/core`

Status: **Redesign Draft**

`@lilium/core` will provide the target-independent execution foundation for Lilium. It will not contain DOM operations, template host operations, virtual nodes, component-wide render loops, global reducers, or action dispatching.

## Proposed features

| Feature | Responsibility |
| --- | --- |
| [`reactivity`](reactivity/index.md) | Signals, computed values, effects, dependency tracking, and batching. |
| [`ownership`](ownership/index.md) | Resource scopes, parent-child ownership, cleanup, and recursive disposal. |
| `scheduler` | Deterministic propagation phases, queues, deduplication, and reentry control. |
| [`context`](context/index.md) | Portable typed identities and values resolved through ownership. |
| `inspection` | Read-only instrumentation contracts for tests and future tooling. |

Component and template definitions are currently proposed for a separate `@lilium/template` package so that reusable UI libraries can depend on a stable object protocol without importing a renderer.

## Proposed source structure

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
  inspection/
    contracts/
      internal/
    types/
      internal/
  index.ts
```

Folders are created only when they contain a required concept. Empty architectural placeholders are avoided.

## Required decisions

- Reactive object API and semantics.
- Ownership and disposal guarantees.
- Scheduler phases and sync boundaries.
- Context defaults and missing-provider behavior.
- Public inspection surface.

See the [Foundation Epic](../../../../plans/epics/000-framework-foundation/index.md) for implementation planning.
