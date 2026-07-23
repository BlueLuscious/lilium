# Compiler Compilation

Status: **Contracts declared**

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
