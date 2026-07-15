# Project Diagnostics

Status: **Future candidate**

Lilium may provide a project-level `lilium check` command for applications and libraries that consume the framework. This command is distinct from the repository tooling used to develop Lilium itself.

Potential diagnostics include compatible package versions, valid `.lily` compiler configuration, renderer and template compatibility, public import usage, and target-specific setup requirements. The command must operate through published contracts and configuration rather than importing repository internals.

The executable package boundary remains undecided. `@lilium/cli` is a candidate, but the command could instead belong to a future facade or dedicated developer-tooling package if that produces a clearer installation and versioning model.

No public command contract or diagnostic format should be defined until the template, renderer, and compiler package boundaries exist.
