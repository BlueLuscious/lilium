# Compiler Compilation

Status: **Implemented**

| Contract or type | Responsibility | Relationships |
| --- | --- | --- |
| `CompilerOptionsType` | Provide the explicit source filename used by diagnostics and mappings. | Passed to `CompilerApi.compile()` with source text. |
| `CompilerResult` | Represent atomic optional output plus deterministic ordered diagnostics. | Returned by `CompilerApi.compile()`. |
| `CompilerOutput` | Keep generated ES2022 ESM and its exact source map together. | Present only when no error diagnostic prevents generation. |

`CompilerResult.output` is atomic rather than exposing independently optional `code` and `map`
fields. Successful compilation therefore cannot return code without its matching map, and any
source error produces `output: undefined`. Diagnostics remain available on every result.

The filename is caller-owned source identity. The compiler may normalize separators for generated
metadata but never resolves the path or reads it.

The implemented `Compiler.compile()` flow is pure and ordered:

1. Validate explicit API arguments.
2. Lex and recoverably parse the complete source.
3. Analyze semantics and lower valid syntax to normalized IR.
4. Return ordered diagnostics without partial output after any source error.
5. Generate one atomic JavaScript and source-map pair from error-free IR.

Committed output and diagnostic compatibility is verified by
[Compiler Conformance](../conformance/index.md).
