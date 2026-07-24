# Compiler Parser

Status: **Implemented internally**

The parser consumes significant lexer tokens and builds a private, source-located concrete syntax
tree for the accepted first `.lily` milestone. It recovers safe declarations after malformed input
and returns diagnostics rather than throwing for source errors.

## Contracts And Types

| Contract or type | Responsibility | Relationships |
| --- | --- | --- |
| `ICompilerFileSyntax` | Preserve the complete file range and ordered recovered top-level declarations. | Contains `TCompilerTopLevelSyntax`. |
| `ICompilerImportSyntax` | Preserve one behavior, primitives, or properties import. | Uses `TCompilerImportKind`, named imports, and string syntax. |
| `ICompilerNamedImportSyntax` | Preserve one exact named import and its span. | Contained by `ICompilerImportSyntax`. |
| `ICompilerStringSyntax` | Preserve an exact quoted module specifier without early decoding. | Contained by `ICompilerImportSyntax`. |
| `ICompilerTemplateSyntax` | Preserve one template block and ordered root nodes. | Contains `ICompilerNodeSyntax`. |
| `ICompilerNodeSyntax` | Preserve one primitive name and ordered property or child declarations. | Recursively contains nodes and `ICompilerPropertySyntax`. |
| `ICompilerPropertySyntax` | Preserve one `value` or `bind` declaration. | Uses `TCompilerPropertyKind` and `ICompilerExpressionSyntax`. |
| `ICompilerExpressionSyntax` | Preserve exact balanced expression spelling and span. | Consumed by semantic analysis and expression validation. |
| `ICompilerParseResult` | Return recoverable syntax and combined lexer/parser diagnostics. | Produced by `LilyParser`. |
| `TCompilerImportKind` | Distinguish behavior, primitive, and property imports. | Discriminates import semantics for later analysis. |
| `TCompilerPropertyKind` | Distinguish static values and reactive bindings. | Discriminates `ICompilerPropertySyntax`. |
| `TCompilerTopLevelSyntax` | Represent ordered import or template syntax. | Stored by `ICompilerFileSyntax`. |
| `TCompilerUnsupportedKeyword` | Describe the stable diagnostic assigned to one unsupported structural keyword. | Used by the internal immutable parser keyword vocabulary. |

Every syntax model is internal and absent from `@lilium/compiler`.

## Parsing Flow

1. `LilyParser` invokes `LilyLexer` for the same source and filename.
2. Comment trivia is filtered from the significant token stream but remains available in the
   lexical result.
3. The parser recognizes ordered imports, one or more recoverable template sections, primitive
   nodes, static properties, and reactive bindings.
4. Expressions are balanced through parentheses, brackets, and braces and retained exactly; their
   allowed operations are not interpreted yet.
5. Lexer and parser diagnostics are sorted together by public diagnostic ordering.

Recovery synchronizes at semicolons, closing braces, accepted declaration keywords, and recognized
top-level keywords. Known deferred structural declarations receive their dedicated `LILY3xxx`
codes and do not prevent later valid nodes from being recovered.

The concrete tree may contain duplicate, misplaced, or unresolved declarations. Import
cardinality, symbol categories, property ordering and uniqueness, literal validity, and binding
purity are semantic analyzer responsibilities. This keeps parsing recoverable and prevents its
grammar from depending on runtime capability objects.

The accepted and deferred syntax remains canonical in the
[Lily Compiler Boundary](../../../architecture/lily-compiler-boundary.md).
