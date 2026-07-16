# `@lilium/template`

Status: **Public contracts declared**

`@lilium/template` defines the target-independent immutable presentation protocol shared by
programmatic authors, future `.lily` compiler output, and Renderer. It depends only on public Core
and Component package roots.

Phase 00 exports contracts and types only. The frozen `Template` value is introduced with its real
identity, declaration, validation, and normalization behavior in the next implementation phase;
the package does not publish placeholder methods.

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
  definition/
    contracts/
    types/
  primitive/
    contracts/
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
