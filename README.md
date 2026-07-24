# Lilium

Lilium is an early-stage frontend framework built around deterministic fine-grained reactivity, explicit resource ownership, object-oriented public APIs, and target-independent execution.

The implemented foundation remains target-independent. Core, Component, Template, Renderer, the
private Console conformance host, and the first `.lily` compiler milestone are implemented and
tested. Renderer DOM is the next planned package. Lilium is not yet a complete browser application
framework.

## Packages

- [`@lilium/core`](docs/en/packages/core/index.md) provides reactivity, ownership, context, scheduling, and the public runtime API.
- [`@lilium/component`](docs/en/packages/component/index.md) provides portable headless component definitions, reactive inputs, setup, instances, and owned runtime creation.
- [`@lilium/template`](docs/en/packages/template/index.md) provides immutable visual declarations, bindings, component composition, slots, and projections.
- [`@lilium/renderer`](docs/en/packages/renderer/index.md) provides universal Template execution, mounted applications, host protocol contracts, and shared conformance.
- [`@lilium/compiler`](docs/en/packages/compiler/index.md) compiles the first `.lily` grammar milestone into deterministic Component and Template modules.
- [`@lilium/renderer-console`](docs/en/packages/renderer-console/index.md) is the private external host used to verify Renderer conformance.

The approved browser boundary is recorded in
[DOM Renderer Boundary](docs/en/architecture/dom-renderer-boundary.md). Proposed packages and their
dependency direction are recorded in
[Package Boundaries](docs/en/architecture/package-boundaries.md). Packages are not created only to
reserve names.

## Requirements

- Node.js 24 or newer for repository development.
- pnpm 10.17.0, pinned through the root `packageManager` field.

Published target-independent runtime packages use ESM and target ES2022. They do not require Node as their execution host.

## Development

```shell
pnpm install --frozen-lockfile
pnpm verify
```

| Command | Responsibility |
| --- | --- |
| `pnpm build` | Build all workspace packages in dependency order. |
| `pnpm test` | Build once, then run tooling, type, runtime, and package tests. |
| `pnpm check` | Validate formatting, JSDoc, documentation, and architecture policies. |
| `pnpm verify` | Run the complete local contract used by continuous integration. |
| `pnpm format` | Apply the configured Biome formatter. |

## Documentation

- [Architecture Principles](docs/en/architecture/principles.md)
- [Execution Model](docs/en/architecture/execution-model.md)
- [API Style](docs/en/architecture/api-style.md)
- [Distribution](docs/en/architecture/distribution.md)
- [DOM Renderer Boundary](docs/en/architecture/dom-renderer-boundary.md)
- [External UI Library Integration](docs/en/architecture/external-ui-library-integration.md)
- [Ecosystem Direction](docs/en/future/ecosystem.md)
- [Current Packages](docs/en/packages/index.md)
- [Future Work](docs/en/future/index.md)

Canonical documentation is written in English under `docs/en/`. Repository README files provide entry points and link to those sources instead of duplicating feature specifications.

## License

Lilium is available under the [ISC License](LICENSE).
