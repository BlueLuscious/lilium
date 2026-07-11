# `@lilium/component`

Status: **In design**

`@lilium/component` defines portable headless component behavior. It depends on `@lilium/core` for reactive inputs, runtime creation, ownership, context resolution, scheduling, and error boundaries.

The package contains no templates, visual slots, renderer operations, DOM APIs, host lifecycle, or compiler syntax.

## Features

- [Component](component/index.md) defines immutable reusable headless definitions.
- [Setup](setup/index.md) defines one-time initialization and its runtime/scope context.
- [Inputs](inputs/index.md) maps declarative input values to read-only reactive signals.
- [Controller](controller/index.md) defines the read-only object exposed by setup.

## Package relationship

`@lilium/template` will consume a `ComponentDefinition` and a `TemplateDefinition` to produce a separate templated-component definition. The headless component never receives an optional template member and never imports the template package.

The future `.lily` compiler may emit headless component definitions, template definitions, or composed definitions while targeting these separate ABIs.

## Deferred concepts

- Public `defineComponent()` API.
- Mutable internal component instance.
- Component creation and disposal engine.
- Component lifecycle beyond ownership setup and cleanup.
- Template composition and visual slots.
