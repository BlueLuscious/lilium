# Project Diagnostics

Status: **Future candidate**

Lilium may provide a project-level `lilium check` command for applications and libraries that consume the framework. This command is distinct from the repository tooling used to develop Lilium itself.

Potential diagnostics include compatible package versions, valid `.lily` compiler configuration, renderer and template compatibility, public import usage, and target-specific setup requirements. The command must operate through published contracts and configuration rather than importing repository internals. Source-level `.lily` diagnostics are already owned by the pure compiler boundary and should be forwarded rather than redefined.

The executable package boundary remains undecided. `@lilium/cli` is a candidate, but the command could instead belong to a future facade or dedicated developer-tooling package if that produces a clearer installation and versioning model.

No public command contract should be defined until the Template, Renderer, and Compiler packages
exist. A future command may render accepted compiler diagnostics, but command formatting and exit
policy remain separate concerns.
