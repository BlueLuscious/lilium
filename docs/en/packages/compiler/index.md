# `@lilium/compiler`

Status: **Lexer and recoverable parser implemented**

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
- [Lexer](lexer/index.md) performs deterministic tokenization while retaining comment trivia.
- [Parser](parser/index.md) builds the private recoverable concrete syntax representation.
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
  index.ts
```

The package root still exports erased public contracts and types only. It deliberately does not
expose a temporary `Compiler` runtime value: the frozen facade will appear when the complete
compilation pipeline can satisfy `CompilerApi`. Lexer tokens and parser declarations are private
package internals; semantic symbols, compiler IR, and generator internals will follow the same
boundary.

The canonical grammar, output rules, diagnostics, and deferred features are defined by the
[Lily Compiler Boundary](../../architecture/lily-compiler-boundary.md).
