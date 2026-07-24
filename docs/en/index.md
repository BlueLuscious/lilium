# Lilium Documentation

Lilium is a frontend framework built around deterministic fine-grained reactivity, explicit resource ownership, object-oriented public APIs, target-independent templates, and an optional optimizing compiler.

The documentation is organized into four areas:

- [Architecture](architecture/principles.md) defines framework-wide guarantees and boundaries.
- [Packages](packages/index.md) documents packages that exist in the repository.
- [Future](future/index.md) records packages and primitives that are planned but do not exist yet.
- [Repository Tooling](tooling/index.md) documents local checks and workspace operations.

Documents marked as **Draft** contain proposals that must be closed before their contracts or runtime are implemented.

## Active architecture boundaries

- [Package Boundaries](architecture/package-boundaries.md) defines package responsibilities and
  dependency direction.
- [Template ABI](architecture/template-abi.md) defines target-independent visual declarations.
- [Renderer Protocol](architecture/renderer-protocol.md) defines universal host execution.
- [DOM Renderer Boundary](architecture/dom-renderer-boundary.md) defines the accepted browser
  specialization for Epic 009.
- [External UI Library Integration](architecture/external-ui-library-integration.md) defines how
  independent libraries such as Lotus integrate without reversing dependencies.
- [Ecosystem Direction](future/ecosystem.md) records Lilium, Lotus, Aster, possible future
  projects, and the replaceable external-tool policy.
