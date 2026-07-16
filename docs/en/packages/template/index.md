# `@lilium/template`

Status: **Definitions and bindings implemented**

`@lilium/template` defines the target-independent immutable presentation protocol shared by
programmatic authors, future `.lily` compiler output, and Renderer. It depends only on public Core
and Component package roots.

The package exports a frozen `Template` value with implemented primitive, property, static value,
binding, node, and definition operations. Component and Slot operations remain contract-only until
their implementation phases; the facade does not publish placeholder methods.

## Features

- [API](api/index.md) declares the complete stateless object API.
- [Definition](definition/index.md) describes normalized programs, fragments, instructions, and references.
- [Primitive](primitive/index.md) describes portable capabilities, properties, nodes, and static values.
- [Binding](binding/index.md) describes independently evaluated dynamic property declarations.
- [Component](component/index.md) describes headless composition and nested component inputs.
- [Slot](slot/index.md) describes slot identities, outlets, projections, and reactive slot inputs.

## Source structure

```text
src/
  api/
    contracts/
    template.api.ts
  definition/
    contracts/
    runtime/
    types/
  primitive/
    contracts/
    runtime/
    types/
  binding/
    contracts/
    types/
  component/
    contracts/
    types/
  slot/
    contracts/
    types/
  index.ts
```

The package contains no runtime occurrences, rendering operations, host handles, ownership
scopes, DOM types, compiler implementation, or mutable virtual tree. The canonical semantics are
defined once by the [Template ABI](../../architecture/template-abi.md).
