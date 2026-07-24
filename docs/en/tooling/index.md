# Repository Tooling

Repository tooling enforces development policies without becoming part of any published Lilium runtime package. Its implementation lives under `tooling/`, while root `package.json` commands provide the stable interface used by contributors and future CI workflows.

## Responsibilities

- `tooling/architecture/` validates dependency direction, layer boundaries, package exports, and host-independent compiler configuration.
- `tooling/documentation/` validates canonical documentation links and the mandatory production JSDoc policy.
- `tooling/workspace/` contains guarded workspace operations such as package distribution cleanup.
- `tooling/shared/` contains implementation utilities shared by multiple tooling domains.
- `tooling/cli/` adapts tooling functions to process exit codes and package-manager commands.
- `tests/tooling/` verifies tooling policies against isolated filesystem fixtures.

## Commands

- `pnpm check:architecture` validates current package and compiler boundaries.
- `pnpm check:docs` validates local links under `docs/en/`.
- `pnpm check:jsdoc` validates production sources under package `src/` directories and `tooling/`.
- `pnpm build` builds every workspace package in dependency order.
- `pnpm test` builds the workspace once, then runs tooling, type, runtime, and package tests.
- `pnpm test:tooling` runs repository-tooling behavior tests.
- `pnpm verify` runs every required static check, build, and test used by CI.
- Package-level `pnpm clean` commands remove only the invoking package's `dist/` directory after validating its workspace boundary.

The `Continuous Integration` workflow installs the pinned workspace package manager and dependencies from the immutable lockfile before invoking only `pnpm verify`. CI does not depend on individual tooling file paths.

## Extension policy

Add a new local rule to the tooling domain that owns its responsibility. The implementation must return diagnostics rather than terminating the process directly, receive filesystem boundaries explicitly, and include fixture-based tests. Only a CLI adapter may translate diagnostics into console output and process exit status.

Repository tooling should become a private workspace package only after it has a real independent consumer or versioning boundary. A future end-user `lilium check` command is a separate product capability and must not expose these repository-specific rules as its public API.

## Review policy

The current tooling is a conservative repository implementation, not a permanent requirement to own every validator. Each check must continue to protect an accepted repository invariant:

- Architecture checks protect Lilium-specific dependency, export, layer, and host-independence boundaries.
- Package cleanup protects a destructive filesystem operation and therefore requires explicit safety tests.
- JSDoc checks exist because production JSDoc is currently mandatory across the repository.
- Documentation-link checks exist because English documentation is a canonical source of truth and broken local navigation would make it unreliable.

A check must be removed when its underlying policy is removed. A custom implementation should be replaced by a maintained standard tool when that tool can express the same policy without duplicated configuration or weaker diagnostics. Formatting, generic linting, Markdown style, and generic dependency analysis should not be reimplemented locally merely to keep them under `tooling/`.

The tooling test suite verifies that repository enforcement does not silently accept invalid input or reject valid input. It is not framework behavior and must remain proportionate to the number and risk of local rules.

## External adapters

Repository tooling may use maintained external development tools without making them permanent
architecture. Biome currently provides generic formatting and linting. Renderer DOM plans to use
Playwright only as a transport adapter for Lilium-owned native-browser conformance scenarios.

Tool-specific types and APIs must not enter published contracts. Stable repository commands,
diagnostic models, and conformance scenarios remain owned by Lilium so an external tool can be
upgraded or replaced without redefining framework behavior.

Building an ecosystem alternative is a separate product decision. It requires independent
consumers and a reusable domain rather than a desire to eliminate one development dependency. The
broader direction is recorded in [Ecosystem Direction](../future/ecosystem.md).
