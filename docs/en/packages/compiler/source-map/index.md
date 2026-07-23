# Compiler Source Map

Status: **Contract declared**

| Contract | Responsibility | Relationships |
| --- | --- | --- |
| `CompilerSourceMap` | Represent one deterministic source-map version 3 payload. | Paired atomically with generated code by `CompilerOutput`. |

The contract fixes `version` to `3` and exposes `file`, ordered `sources`, exact `sourcesContent`,
ordered `names`, and Base64-VLQ `mappings`. Generated maps contain no absolute workspace path,
timestamp, machine identity, or nondeterministic hash.

Mapping production belongs to the generator phase. This feature currently freezes only the public
result shape.
