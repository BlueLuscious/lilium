# Compiler Lexer

Status: **Implemented internally**

The lexer deterministically converts explicit `.lily` source text into immutable source-located
tokens. It performs no semantic resolution and exports no token model from the package root.

## Contracts And Types

| Contract or type | Responsibility | Relationships |
| --- | --- | --- |
| `ICompilerToken` | Retain one token category, exact lexeme, and half-open source span. | Uses `TCompilerTokenKind` and `CompilerSourceSpan`; consumed by `LilyParser`. |
| `ICompilerLexResult` | Return ordered tokens and lexical diagnostics atomically. | Produced by `LilyLexer`; includes one terminal EOF token. |
| `TCompilerTokenKind` | Distinguish identifiers, literals, punctuation, operators, comments, invalid input, and EOF. | Discriminates `ICompilerToken`. |

All three concepts are internal and absent from `@lilium/compiler`.

## Runtime

`LilyLexer` scans UTF-16 source offsets monotonically and uses
[`CompilerSourceLocator`](../source/index.md) for positions. It:

- retains line and block comments as trivia tokens while omitting whitespace tokens;
- recognizes JavaScript-compatible Unicode identifiers;
- matches operators longest-first;
- retains quoted strings and complete template literals exactly as authored;
- balances nested braces, strings, comments, and templates inside template substitutions;
- reports unexpected characters and unterminated comments or literals without throwing;
- emits immutable tokens and diagnostics in deterministic source order.

The parser filters comment tokens only when consuming significant grammar. Retaining comments in
the lexical result preserves exact future formatting and tooling relationships without making
comments syntax declarations.

Literal meaning and expression purity are intentionally not lexer responsibilities. They belong to
the analyzer described by the canonical
[Lily Compiler Boundary](../../../architecture/lily-compiler-boundary.md).
