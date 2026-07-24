# Compiler Intermediate Representation

Status: **Implemented internally**

The compiler IR is the immutable generator-oriented boundary between semantic analysis and code
generation. It mirrors only concepts required by the accepted public Template ABI and contains no
Renderer, host, filesystem, or runtime objects.

## Contracts

| Contract | Responsibility | Relationships |
| --- | --- | --- |
| `ICompilerModuleIr` | Represent one complete validated Lily module. | Contains imports, one behavior local, root nodes, and the complete source span. |
| `ICompilerImportIr` | Preserve one validated import category, names, quoted source, and span. | Ordered by `ICompilerModuleIr.imports`. |
| `ICompilerNodeIr` | Normalize one primitive into separate property and child sequences. | Recursively contains nodes and `ICompilerPropertyIr`. |
| `ICompilerPropertyIr` | Represent one resolved property and normalized expression. | Contains `ICompilerExpressionIr` plus declaration mappings. |
| `ICompilerExpressionIr` | Unify static and binding expressions with a mode discriminant. | Preserves exact validated source and mapping span. |

Every collection and record is frozen during lowering. Source order remains deterministic, while
properties and children are separated only after analysis proves that no property follows a child.

The IR retains local imported names rather than runtime capability objects. `LilyGenerator` uses
those names to emit calls to the public `Template` object API and uses retained spans for source
mappings. No IR is returned when any lexer, parser, or semantic error exists.
