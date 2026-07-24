# Compiler API

Status: **Contract and frozen facade implemented**

| Contract | Responsibility | Relationships |
| --- | --- | --- |
| `CompilerApi` | Compile one explicit source string and options into one immutable result. | Implemented by the frozen `Compiler` facade. |

The minimum object operation is `compile(source, { filename })`. Its arguments fully determine the
result: the API has no ambient project, current directory, file loader, module resolver, cache, or
target renderer.

Invalid API argument shapes throw synchronously. Invalid or unsupported `.lily` source returns
ordered diagnostics and no output.

`Compiler` composes the complete pure pipeline:

1. Recoverable parsing.
2. Semantic analysis and IR lowering.
3. Deterministic ESM and source-map generation when IR exists.

The facade is frozen, stateless, and is the only runtime value exported from the package root.
