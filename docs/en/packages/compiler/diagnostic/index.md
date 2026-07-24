# Compiler Diagnostics

Status: **Implemented and covered by golden diagnostics**

## Contracts And Types

| Contract or type | Responsibility | Relationships |
| --- | --- | --- |
| `CompilerDiagnostic` | Represent one stable primary source failure. | Contains code, severity, filename, span, and related information. |
| `CompilerRelatedDiagnostic` | Attach a secondary message and source range to a primary diagnostic. | Stored in deterministic order by `CompilerDiagnostic.related`. |
| `CompilerDiagnosticCodeType` | Restrict diagnostics to the reserved first-milestone vocabulary. | Grouped by lexing/parsing, semantics, and unsupported source features. |
| `CompilerDiagnosticSeverityType` | Restrict the first milestone to `error`. | Warnings require a later explicit extension. |

Diagnostics are immutable and ordered by primary start offset, end offset, then code. Messages have
no terminal formatting. API misuse throws rather than producing a source diagnostic.

## Reserved Codes

| Code | Responsibility |
| --- | --- |
| `LILY1001` | Unexpected source character. |
| `LILY1002` | Unterminated block comment. |
| `LILY1003` | Unterminated string literal. |
| `LILY1004` | Missing declaration semicolon. |
| `LILY1005` | Missing expected token. |
| `LILY1006` | Unexpected declaration or token sequence. |
| `LILY1007` | Invalid static literal expression. |
| `LILY1008` | Invalid binding expression shape. |
| `LILY1009` | Unexpected end of source. |
| `LILY2001` | Missing behavior import. |
| `LILY2002` | Duplicate behavior import. |
| `LILY2003` | Unknown or wrongly categorized primitive. |
| `LILY2004` | Unknown or wrongly categorized property. |
| `LILY2005` | Missing template section. |
| `LILY2006` | Duplicate template section. |
| `LILY2007` | Duplicate imported local name. |
| `LILY2008` | Collision with a compiler-reserved identifier. |
| `LILY2009` | Declaration in an invalid source location. |
| `LILY2010` | Property declared after child nodes. |
| `LILY2011` | Duplicate property on one node. |
| `LILY2012` | Invalid top-level category, order, or cardinality. |
| `LILY3001` | Inline setup, script, state, input, or controller declaration. |
| `LILY3002` | Arbitrary call or component command invocation. |
| `LILY3003` | TypeScript-only source syntax. |
| `LILY3004` | Nested component, component-input, slot, or projection syntax. |
| `LILY3005` | Conditional structural region. |
| `LILY3006` | Repetition syntax. |
| `LILY3007` | Dynamic fragment or explicit anchor syntax. |
| `LILY3008` | Inline callback expression. |
| `LILY3009` | Async expression or resource syntax. |
| `LILY3010` | Markup, built-in platform element, attribute, or event syntax. |
| `LILY3011` | Style, scoped style, CSS, or asset declaration. |
| `LILY3012` | Transition, animation, portal, hydration, or streaming syntax. |
| `LILY3013` | Preprocessor, macro, plugin, or HMR directive. |

The lexer, parser, and analyzer phases use these identities consistently. Every explicitly
unsupported structural keyword and the accepted malformed expression families are frozen by
[Compiler Conformance](../conformance/index.md). Adding or changing a code is a compatibility
decision rather than an implementation detail.
