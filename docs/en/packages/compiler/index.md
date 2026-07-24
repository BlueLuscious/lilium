# `@lilium/compiler`

Status: **First compiler milestone complete**

`@lilium/compiler` is a pure source-to-source package for explicit `.lily` source text. It
produces deterministic readable ES2022 ESM targeting only public Component and Template ABIs,
version 3 source maps, and structured source-located diagnostics.

The package performs no file-system access, module loading, package resolution, logging, process
termination, rendering, or platform work. Build tools, editor integrations, CLIs, and bundler
plugins remain external adapters around this pure boundary.

## Features

- [API](api/index.md) declares the stateless object-based compilation operation.
- [Analysis](analysis/index.md) resolves source semantics and validates expressions.
- [Compilation](compilation/index.md) defines explicit options and atomic result/output contracts.
- [Conformance](conformance/index.md) freezes golden output and proves public runtime compatibility.
- [Diagnostic](diagnostic/index.md) defines stable codes, severity, primary spans, and related information.
- [Generator](generator/index.md) emits deterministic public-ABI ESM from validated IR.
- [Lexer](lexer/index.md) performs deterministic tokenization while retaining comment trivia.
- [Parser](parser/index.md) builds the private recoverable concrete syntax representation.
- [IR](ir/index.md) defines the private generator-oriented normalized module representation.
- [Source](source/index.md) defines offset and human-facing source positions and spans.
- [Source Map](source-map/index.md) defines deterministic version 3 source-map output.

## Source Structure

```text
src/
  analysis/
    contracts/internal/
    types/internal/
    runtime/
  api/
    contracts/
  compilation/
    contracts/
    types/
  diagnostic/
    contracts/
    types/
    runtime/
  ir/
    contracts/internal/
  generator/
    types/internal/
    runtime/
  lexer/
    contracts/internal/
    types/internal/
    runtime/
  parser/
    contracts/internal/
    types/internal/
    runtime/
  source/
    contracts/
    runtime/
  source-map/
    contracts/
    types/internal/
    runtime/
  index.ts
```

The package root exports public contracts and types plus the frozen stateless `Compiler` facade.
Lexer tokens, parser declarations, semantic symbols, compiler IR, generator state, and source-map
encoding remain private package internals.

The canonical grammar, output rules, diagnostics, and deferred features are defined by the
[Lily Compiler Boundary](../../architecture/lily-compiler-boundary.md).
