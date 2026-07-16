# Distribution

Status: **MVP baseline accepted**

## JavaScript baseline

Lilium packages publish a single JavaScript build targeting ES2022. The fixed target preserves native private class fields and methods, keeps compiler output predictable across TypeScript upgrades, and avoids downlevel helpers required only by older runtimes.

ES2022 is the minimum language baseline for package consumers. Raising it requires concrete framework functionality and an explicit compatibility decision rather than automatically following the newest ECMAScript edition.

## Module format

Lilium publishes ECMAScript modules. Package source and output use ESM, and package manifests declare `"type": "module"`.

CommonJS, legacy ECMAScript targets, and parallel modern/legacy artifacts are outside the MVP. They may be reconsidered only in response to a demonstrated integration requirement.

## Host independence

The ES2022 baseline does not introduce DOM knowledge into target-independent packages. JavaScript language compatibility and renderer host compatibility are separate boundaries: Core and Component remain host-independent, while future renderer adapters define their own host requirements.

See [Architecture Principles](principles.md), [API Style](api-style.md), and [Package Boundaries](package-boundaries.md).

## Development runtime

The repository workspace requires Node.js 24 or newer and uses the pnpm version pinned in the root `packageManager` field. Continuous integration validates the workspace on Node.js 24 LTS.

Target-independent runtime packages do not declare a Node engine because Node is not their required execution host. Their consumer compatibility contract is ESM and ES2022. The pure compiler library also accepts source strings without Node APIs. A future Node-hosted adapter such as a CLI, compiler build integration, development server, or server renderer must declare and test its own Node engine explicitly.
