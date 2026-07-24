# Compiler Analysis

Status: **Implemented internally**

Semantic analysis consumes the recoverable parser result, resolves local source declarations, and
returns normalized IR only when the complete compiler diagnostic set is empty. It performs no
module loading, external type checking, host discovery, or runtime capability inspection.

## Contracts And Types

| Contract or type | Responsibility | Relationships |
| --- | --- | --- |
| `ICompilerAnalysisResult` | Return ordered diagnostics and optional error-free IR. | Contains `ICompilerModuleIr` only when parser and semantic diagnostics are empty. |
| `TCompilerSymbol` | Retain one imported local name, category, and source span. | Stored privately by `LilyAnalyzer`. |
| `TCompilerSymbolCategory` | Distinguish behavior, primitive, and property locals. | Used by source symbol resolution. |

All analysis concepts are internal and absent from `@lilium/compiler`.

## Semantic Flow

1. Register every imported local name in one source symbol table.
2. Reject duplicates and compiler-reserved generated identifiers.
3. Validate import ordering, required categories, behavior cardinality, and template cardinality.
4. Resolve every node against primitive imports and every property against property imports.
5. Validate property-before-child ordering and per-node property uniqueness.
6. Validate static and binding expressions without executing source.
7. Lower recovered syntax into immutable IR and discard it when any diagnostic exists.

`LilyExpressionValidator` accepts recursive immutable literal values for `value`. For `bind`, it
accepts literal composition, `inputs` and `controller` paths, zero-argument signal `.get()` reads,
callback property references, approved unary and binary operations, conditionals, and template
substitutions. Calls, arrows, async/resource forms, TypeScript expressions, assignments, updates,
spread, and unrelated roots are rejected with stable diagnostics.

Expression diagnostics are mapped back from isolated expression offsets into exact complete-source
UTF-16 spans. Nested template substitutions recursively use the same validator.

The analyzer does not verify external property ownership or value generic compatibility because it
does not load imported modules. Those remain observable public Template validation responsibilities
when the generated module executes.
