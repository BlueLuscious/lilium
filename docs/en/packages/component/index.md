# `@lilium/component`

Status: **MVP runtime complete**

`@lilium/component` defines portable headless component behavior. It depends on `@lilium/core` for reactive inputs, runtime creation, ownership, context resolution, scheduling, and error boundaries.

The package contains no templates, visual slots, renderer operations, DOM APIs, host lifecycle, or compiler syntax.

## Features

- [API](api/index.md) defines the object-oriented package entry point.
- [Component](component/index.md) defines immutable reusable headless definitions.
- [Setup](setup/index.md) defines one-time initialization and its runtime/scope context.
- [Inputs](inputs/index.md) maps declarative values to stable runtime-read-only signals.
- [Controller](controller/index.md) defines the read-only object exposed by setup.
- [Instance](instance/index.md) defines the public handle and its internal input lifecycle.
- [Runtime](runtime/index.md) defines owned component creation and its private engine boundary.
- [Integration](integration/index.md) provides the verified Renderer-facing occurrence bridge outside the package root.

## Package relationship

The accepted [Template ABI](../../architecture/template-abi.md) composes a
`ComponentDefinition` and compatible `TemplateDefinition` into a separate
`TemplatedComponentDefinition`. The headless component never receives an optional template member
and never imports the template package.

The first accepted [`.lily` compiler boundary](../../architecture/lily-compiler-boundary.md) imports
an existing headless definition and emits a Template definition plus composition. Inline setup and
direct `Component.define()` generation remain deferred.

## External concepts

- Template declarations, component-template composition, and visual slots belong to
  `@lilium/template`.
- Mounting, host lifecycle, and rendered occurrences belong to `@lilium/renderer`.
