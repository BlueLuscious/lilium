# Future Packages

This document records packages that do not currently exist. Moving a package into `docs/en/packages/` requires creating the corresponding repository package.

## Approved implementation milestones

- `@lilium/renderer-console`: private renderer conformance adapter and diagnostic fixture.
- `@lilium/compiler`: `.lily` parser, analysis, and code generation.
- `@lilium/renderer-dom`: browser host implementation.

Creation order, prerequisites, and package gates are defined once in
[Package Boundaries](../architecture/package-boundaries.md). These remaining packages stay outside
the workspace until their respective implementation epic begins. Active Template and Renderer
packages are documented under [Current Packages](../packages/index.md).

## Post-MVP candidates

- `@lilium/renderer-server`: server rendering and serialization.
- `@lilium/cli`: optional project diagnostics and framework tooling, including a future `lilium check` command.
- `@lilium/router`: routing primitives integrated with ownership.
- `@lilium/testing`: public test utilities and renderer fixtures.
- `@lilium/devtools`: graph, scope, component, and update inspection.
- `@lilium/compiler-vite`: Vite integration for `.lily` files.
- `lilium`: optional browser-oriented facade package.

## Exploratory application targets

The following capabilities are recorded without approving package names or implementation boundaries:

- Static-site generation may compile routes and content into deployable files, serving a role comparable to dedicated static-site generators such as Eleventy (11ty).
- Progressive Web Application support may compose browser rendering, routing, manifests, service workers, offline behavior, and build integrations.
- A future Lilium Native platform may execute shared component and template concepts through a native host renderer rather than DOM emulation.

## Accepted foundation

The target-independent definition, binding, composition, and slot model is accepted in
[Template ABI](../architecture/template-abi.md).

The universal execution, host-session, placement, cleanup, and conformance model is accepted in
[Renderer Protocol](../architecture/renderer-protocol.md).

The first `.lily` grammar, compiler result, diagnostics, deterministic ESM, and source-map model is
accepted in [Lily Compiler Boundary](../architecture/lily-compiler-boundary.md). Compiler
implementation follows the programmatic Template and Renderer milestone.

## Deferred foundation work

- Prove whether browser bootstrap composition warrants a facade package instead of direct package APIs.
- Decide whether project diagnostics belong to `@lilium/cli`, the facade package, or another executable boundary.
- Define CSR, SSR, serialization, and hydration responsibilities without coupling universal rendering to a host.
- Decide whether static generation is a compiler mode, application builder, CLI capability, renderer composition, or dedicated package.
- Decide which PWA responsibilities belong to Lilium and which remain platform or build-tool integrations.
- Prove that the universal renderer protocol can support a native host before proposing a native renderer package.

Package creation is driven by a real dependency boundary, not by feature count alone.
