# Package Boundaries

Status: **Draft**

## Proposed foundation packages

| Package | Responsibility | Dependencies |
| --- | --- | --- |
| `@lilium/core` | Reactivity, ownership, scheduling, and context. | None. |
| `@lilium/template` | Component definitions, template definitions, and binding contracts. | `@lilium/core`. |
| `@lilium/renderer` | Universal template execution and host renderer protocol. | `@lilium/core`, `@lilium/template`. |
| `@lilium/renderer-dom` | DOM host, events, attributes, mounting, and JSX integration. | `@lilium/renderer`. |
| `@lilium/compiler` | Parses `.lily` files and emits code targeting the template ABI. | Build-time contracts only. |
| `@lilium/renderer-console` | Reference adapter used to validate renderer independence. | `@lilium/renderer`. |

Only packages that physically exist under `packages/` receive package documentation under `docs/en/packages/`. Planned packages remain documented here and in [Future Packages](../future/packages.md) until they are created.

## Why templates are separate

An external UI component library should be able to publish immutable component and template definitions without depending on DOM behavior or renderer internals. A separate template package provides that stable, lightweight protocol.

## Dependency direction

```text
core <- template <- renderer <- renderer-dom
                   ^
                   |
            renderer-console

compiler --emits--> template ABI
```

Dependencies must not point upward or sideways around these boundaries. In particular, `core` must not import template, renderer, compiler, or DOM concepts.

## Package root policy

Each package root is a distribution boundary, not a feature. Source code remains organized by semantic feature. A package-level `src/index.ts` composes public exports; folders such as `src/core/` or `src/kernel/` are created only if an actual feature has that responsibility.

## Open decisions

- Whether `@lilium/template` warrants a package from the first implementation or begins as an isolated feature in `@lilium/renderer`.
- Whether `@lilium/compiler` is included in the first runnable MVP or immediately follows the programmatic-template MVP.
- Whether `@lilium/renderer-console` is published or remains a private conformance fixture.
- Whether a facade package named `lilium` should eventually compose the browser defaults.
