# Future Packages

This document records packages that do not currently exist. Moving a package into `docs/en/packages/` requires creating the corresponding repository package.

## Proposed foundation

- `@lilium/template`: target-independent template, binding, and component-template composition model.
- `@lilium/renderer`: universal renderer and host protocol.
- `@lilium/renderer-dom`: browser implementation.
- `@lilium/compiler`: `.lily` parser, analysis, and code generation.
- `@lilium/renderer-console`: renderer conformance adapter and diagnostic example.

## Post-MVP candidates

- `@lilium/renderer-server`: server rendering and serialization.
- `@lilium/router`: routing primitives integrated with ownership.
- `@lilium/testing`: public test utilities and renderer fixtures.
- `@lilium/devtools`: graph, scope, component, and update inspection.
- `@lilium/compiler-vite`: Vite integration for `.lily` files.
- `lilium`: optional browser-oriented facade package.

## Deferred foundation decisions

- Define the target-independent template instantiation and dynamic binding ABI.
- Define the universal renderer host boundary and cleanup ordering.
- Decide whether `@lilium/renderer-console` is publishable or only a conformance fixture.
- Define compiler output ownership between component and template packages.
- Choose the minimum `.lily` compiler milestone.
- Decide whether the browser defaults require a facade package.

Package creation is driven by a real dependency boundary, not by feature count alone.
