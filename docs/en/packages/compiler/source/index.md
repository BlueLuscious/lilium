# Compiler Source

Status: **Contracts declared**

| Contract | Responsibility | Relationships |
| --- | --- | --- |
| `CompilerSourcePosition` | Preserve a zero-based UTF-16 offset and one-based line/column pair. | Used by both ends of `CompilerSourceSpan`. |
| `CompilerSourceSpan` | Represent one half-open source range. | Used by primary and related compiler diagnostics. |

Offsets and columns count UTF-16 code units. CRLF is one logical line break. `start` is inclusive
and `end` is exclusive, allowing empty insertion ranges and deterministic diagnostic sorting.

The source text itself remains the first direct argument to `CompilerApi.compile()` rather than a
filesystem-backed source object.
