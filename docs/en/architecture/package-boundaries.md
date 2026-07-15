# Package Boundaries

Status: **Core and component foundation accepted**

## Package boundaries

| Package | Responsibility | Dependencies |
| --- | --- | --- |
| `@lilium/core` | Reactivity, ownership, scheduling, and context. | None. |
| `@lilium/component` | Headless component definitions, reactive inputs, setup, and controllers. | `@lilium/core`. |
| `@lilium/template` | Template definitions, bindings, and component-template composition. | `@lilium/core`, `@lilium/component`. |
| `@lilium/renderer` | Universal component/template execution and host renderer protocol. | `@lilium/core`, `@lilium/component`, `@lilium/template`. |
| `@lilium/renderer-dom` | DOM host, events, attributes, mounting, and JSX integration. | `@lilium/renderer`. |
| `@lilium/compiler` | Parses `.lily` files and emits code targeting the template ABI. | Build-time contracts only. |
| `@lilium/renderer-console` | Reference adapter used to validate renderer independence. | `@lilium/renderer`. |

Only packages that physically exist under `packages/` receive package documentation under `docs/en/packages/`. Planned packages remain documented here and in [Future Packages](../future/packages.md) until they are created.

## Why components are separate

Headless behavior has a lifecycle and reuse boundary independent of visual structure. An external UI library can publish component definitions without requiring templates, DOM behavior, or renderer internals.

`ComponentDefinition` owns setup behavior, reactive inputs, and a public controller. It never contains an optional template field. This preserves the dependency direction from presentation toward behavior.

## Why templates are separate

The template package defines target-independent visual structure, reactive bindings, and composition with a headless component. A default presentation is a separate templated-component object, not mutable or optional state on the headless definition.

Libraries may export a headless component, one or more templates, and ready-to-render component-template compositions independently.

## Dependency direction

```text
component        --> core
template         --> core, component
renderer         --> core, component, template
renderer-dom     --> renderer
renderer-console --> renderer

compiler --emits--> component and template ABIs
```

Dependencies must not point upward around these boundaries. In particular, `core` must not import component, template, renderer, compiler, or DOM concepts, and `component` must not import template or renderer concepts.

Core and Component may expose narrow `integration` subpaths for framework adapters. These are
supported public package boundaries rather than implementation paths, and they do not enlarge the
end-user APIs exported from package roots. Their accepted authority and dependency direction are
defined by [Rendering Integration](rendering-integration.md).

Run `pnpm check:architecture` to verify the current package dependency direction, implementation import boundaries, public barrels, and host independence.

## Package root policy

Each package root is a distribution boundary, not a feature. Source code remains organized by semantic feature. A package-level `src/index.ts` composes public exports; folders such as `src/core/` or `src/kernel/` are created only if an actual feature has that responsibility.

## Open decisions

- Whether `@lilium/compiler` is included in the first runnable MVP or immediately follows the programmatic-template MVP.
- Whether `@lilium/renderer-console` is published or remains a private conformance fixture.
- Whether a facade package named `lilium` should eventually compose the browser defaults.

These decisions belong to the future template, renderer, and compiler foundation epic. They do not block `@lilium/core` or `@lilium/component` runtime implementation.
