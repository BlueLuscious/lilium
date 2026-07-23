# `@lilium/compiler`

Status: **Public compiler boundary declared**

`@lilium/compiler` is a pure source-to-source package for explicit `.lily` source text. It will
produce deterministic readable ES2022 ESM targeting only public Component and Template ABIs,
version 3 source maps, and structured source-located diagnostics.

The package performs no file-system access, module loading, package resolution, logging, process
termination, rendering, or platform work. Build tools, editor integrations, CLIs, and bundler
plugins remain external adapters around this pure boundary.

## Features

- [API](api/index.md) declares the stateless object-based compilation operation.
- [Compilation](compilation/index.md) defines explicit options and atomic result/output contracts.
- [Diagnostic](diagnostic/index.md) defines stable codes, severity, primary spans, and related information.
- [Source](source/index.md) defines offset and human-facing source positions and spans.
- [Source Map](source-map/index.md) defines deterministic version 3 source-map output.

## Source Structure

```text
src/
  api/
    contracts/
  compilation/
    contracts/
    types/
  diagnostic/
    contracts/
    types/
  source/
    contracts/
  source-map/
    contracts/
  index.ts
```

Phase 00 exports erased public contracts and types only. It deliberately does not expose a
temporary `Compiler` runtime value: the frozen facade will appear when a real compilation pipeline
can satisfy `CompilerApi`. Lexer trees, parser declarations, semantic symbols, compiler IR, and
generator internals will remain outside the package root.

The canonical grammar, output rules, diagnostics, and deferred features are defined by the
[Lily Compiler Boundary](../../architecture/lily-compiler-boundary.md).
