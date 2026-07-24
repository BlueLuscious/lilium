# Compiler Source Map

Status: **Contract and deterministic encoder implemented**

| Contract | Responsibility | Relationships |
| --- | --- | --- |
| `CompilerSourceMap` | Represent one deterministic source-map version 3 payload. | Paired atomically with generated code by `CompilerOutput`. |

The contract fixes `version` to `3` and exposes `file`, ordered `sources`, exact `sourcesContent`,
ordered `names`, and Base64-VLQ `mappings`. Generated maps contain no absolute workspace path,
timestamp, machine identity, or nondeterministic hash.

`GeneratedSourceWriter` records generated UTF-16 line and column positions during ESM emission.
`CompilerSourceMapEncoder` encodes ordered segments through source-map version 3 Base64-VLQ delta
fields. Source index remains zero because one compilation has one explicit source.

Mappings cover user imports, primitive names, property names, static and binding expression starts,
and default behavior composition. Helper punctuation may remain unmapped.

`file` appends `.js` to the normalized caller filename. `sources` contains that normalized filename,
while `sourcesContent` preserves the exact original source including its line endings. `names`
remains empty because this milestone does not emit name-indexed mapping segments.
