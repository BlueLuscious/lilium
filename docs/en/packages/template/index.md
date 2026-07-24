# `@lilium/template`

Status: **First public ABI hardened**

`@lilium/template` defines the target-independent immutable presentation protocol shared by
programmatic authors, generated `.lily` compiler output, and Renderer. It depends only on public Core
and Component package roots.

The package exports a frozen `Template` value implementing the complete first-milestone
declaration API: primitive and property identities, values, bindings, nodes, definitions,
component composition, slots, outlets, and projections.

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
    runtime/
    types/
  slot/
    contracts/
    runtime/
    types/
  index.ts
```

The package contains no runtime occurrences, rendering operations, host handles, ownership
scopes, DOM types, compiler implementation, or mutable virtual tree. The canonical semantics are
defined once by the [Template ABI](../../architecture/template-abi.md).

## Public boundary

The package root exposes `Template` as its only runtime value. Every public contract and type is a
type-only root export. No feature, runtime, contract, integration, or internal subpath is exported.
Programmatic authors and generated `.lily` modules therefore require only `@lilium/template`,
`@lilium/component`, and their own primitive modules.

Built-package tests freeze the exact `Template` method snapshot, reject implementation subpaths,
and execute a complete declaration composition through public package roots. Cross-package type
tests verify the generic relationships with public Core and Component exports.
