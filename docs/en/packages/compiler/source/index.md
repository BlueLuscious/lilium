# Compiler Source

Status: **Contracts and internal location mapping implemented**

| Contract | Responsibility | Relationships |
| --- | --- | --- |
| `CompilerSourcePosition` | Preserve a zero-based UTF-16 offset and one-based line/column pair. | Used by both ends of `CompilerSourceSpan`. |
| `CompilerSourceSpan` | Represent one half-open source range. | Used by primary and related compiler diagnostics. |

Offsets and columns count UTF-16 code units. CRLF is one logical line break. `start` is inclusive
and `end` is exclusive, allowing empty insertion ranges and deterministic diagnostic sorting.

The source text itself remains the first direct argument to `CompilerApi.compile()` rather than a
filesystem-backed source object.

## Runtime

`CompilerSourceLocator` indexes logical line starts once and maps original UTF-16 offsets into
immutable positions and spans. It treats CRLF as one break without rewriting source text, so
diagnostic offsets continue to address the caller's exact input while line and column semantics
remain equivalent across LF and CRLF files.
