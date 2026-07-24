# Ecosystem Direction

This document records the intended project boundaries around Lilium without reserving package
names, approving implementations, or forcing dependencies before concrete requirements exist.

## Current direction

The first envisioned independent projects are:

| Project | Responsibility |
| --- | --- |
| Lilium | Frontend framework, portable component and template execution, rendering protocols, and the `.lily` compiler. |
| Lotus | Framework-neutral headless UI behavior plus optional framework and target adapters. |
| Aster | Portable icon assets and APIs with optional framework-specific presentation adapters. |

Each project owns its domain, release lifecycle, and public API. Being part of one ecosystem does
not permit hidden coupling or reversed dependencies.

Lilium never requires Lotus or Aster. Applications may select either project, another library, or
their own implementation. Lotus and Aster integrations depend toward the public Lilium boundaries
they use. Their framework-neutral roots remain usable without Lilium.

The accepted Lotus direction is specified in
[External UI Library Integration](../architecture/external-ui-library-integration.md). Aster
contracts remain undefined until its independent requirements are reviewed.

## Aster composition

Aster must remain usable directly by a Lilium application, through an optional Lotus composition,
or through another framework adapter. Its portable root owns icon definitions, metadata, and
catalog behavior without importing Lilium or Lotus.

A future Lilium adapter may translate those portable definitions into Lilium components and
templates. The conceptual package name `@aster/lilium` describes the boundary but is not reserved
until Aster contracts are designed.

Lotus headless behavior must not require Aster. Lotus components and templates may expose generic
icon inputs, slots, or semantic presentation ports that accept any compatible icon source. A
Lotus-specific integration may then compose those ports with the Aster Lilium adapter:

```text
optional Lotus-Aster Lilium integration
    |
    +--> Lotus Lilium adapter
    +--> Aster Lilium adapter
```

The integration should normally belong to Lotus because Lotus knows whether an icon represents a
toggle, close action, disclosure state, navigation item, or another component role. Aster owns the
icon asset and its portable representation but does not know Lotus component structure.

Names such as `@lotus/aster-lilium` are conceptual examples, not approved package names. The stable
boundary is that integration remains optional and neither portable root depends on the other.
This permits:

- Lilium with Aster and no Lotus;
- Lilium with Lotus and no Aster;
- Lilium with Lotus and Aster through explicit composition;
- Lotus with another icon library;
- Aster with another framework;
- Lilium with neither external library.

## Potential projects

Additional ecosystem projects may emerge when a reusable responsibility has independent consumers.
Candidates include:

- headless testing contracts, fixtures, assertions, and framework adapters;
- source analysis, formatting, linting, or project-diagnostic tooling;
- browser automation or cross-runtime conformance infrastructure;
- application, build, deployment, or developer-experience tools.

These are product directions, not commitments to recreate every external development dependency.
A candidate becomes an independent project only when it has a coherent domain, users beyond one
repository script, a stable public boundary, and maintenance value that justifies ownership.

## External tool policy

Lilium may use focused external development tools while its own requirements mature. Current
examples include Biome for generic formatting and linting and the planned Playwright adapter for
native-browser conformance.

An external tool remains replaceable when:

- production packages and public APIs do not expose its types;
- repository commands or owned scenario contracts provide the stable entry point;
- tool-specific configuration and adapters remain isolated;
- versions are pinned and adoption has a concrete verification benefit;
- removing it does not require rewriting framework behavior or conformance expectations.

Replacement is not a goal by itself. Lilium should build an internal or ecosystem alternative only
when doing so creates a stronger reusable product, expresses domain rules unavailable in maintained
tools, or removes a material architectural limitation. Dependency count alone does not justify
maintaining a formatter, browser controller, or test runner.

## Naming and dependency discipline

Future project and package names remain provisional until their repositories and contracts exist.
The ecosystem follows capability-based dependency direction:

```text
application
    |
    +--> Lilium
    +--> Lotus adapters ----> Lilium public packages
    +--> Aster adapters ----> selected framework packages
    +--> optional Lotus-Aster integration
                  |                |
                  v                v
           Lotus adapter      Aster adapter

Lotus headless core --------> no Lilium dependency
Aster portable core --------> no Lilium dependency
Lotus headless core --------X-> Aster portable core
Aster portable core --------X-> Lotus headless core
Lilium --------------------X-> Lotus or Aster
```

Shared branding never replaces explicit contracts, adapters, or package boundaries.
