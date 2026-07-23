# Compiler API

Status: **Contract declared**

| Contract | Responsibility | Relationships |
| --- | --- | --- |
| `CompilerApi` | Compile one explicit source string and options into one immutable result. | Accepts `CompilerOptionsType` and returns `CompilerResult`. |

The minimum object operation is `compile(source, { filename })`. Its arguments fully determine the
result: the API has no ambient project, current directory, file loader, module resolver, cache, or
target renderer.

Invalid API argument shapes may throw synchronously. Invalid or unsupported `.lily` source returns
ordered diagnostics and no output. The runtime `Compiler` facade is intentionally deferred until
the complete operation has a real implementation; Phase 00 exports the contract only.
