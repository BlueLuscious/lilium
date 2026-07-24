# Packages

This section documents packages that currently exist under `packages/`. Package dependencies and proposed additions are described in [Package Boundaries](../architecture/package-boundaries.md).

## Current packages

- [`@lilium/core`](core/index.md): target-independent reactivity, ownership, context, and scheduling contracts.
- [`@lilium/component`](component/index.md): portable headless component definitions and runtime built on Core.
- [`@lilium/compiler`](compiler/index.md): pure `.lily` source-to-source compiler boundary.
- [`@lilium/template`](template/index.md): immutable visual declarations, component composition, slots, and projections.
- [`@lilium/renderer`](renderer/index.md): universal Template execution and target-independent host protocol contracts.
- [`@lilium/renderer-console`](renderer-console/index.md): private logical host adapter and external Renderer conformance infrastructure.

Packages must not receive documentation in this section before their repository package exists. Planned packages are tracked in [Future Packages](../future/packages.md).
