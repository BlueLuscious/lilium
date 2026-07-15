# Application Targets

Status: **Exploratory**

Lilium may eventually support multiple application targets without moving target-specific behavior into Core, Component, Template, or the universal Renderer protocol. These targets are long-term directions rather than approved packages or MVP requirements.

## Static sites

Lilium may provide static-site generation with a role comparable to dedicated generators such as Eleventy (11ty). A build could evaluate routes, content, templates, and server-rendering capabilities ahead of deployment to produce static HTML and related assets.

Static generation should reuse accepted compiler, template, renderer, and serialization boundaries. It must not require a second component model or embed filesystem and content-loading concerns into runtime packages.

The owning boundary remains undecided. It could become a CLI command, compiler mode, application builder, renderer composition, or dedicated package after concrete build scenarios exist.

## Progressive Web Applications

Lilium may support installable and offline-capable web applications by composing browser rendering with web app manifests, service workers, caching strategies, routing, and build integration.

PWA support is not a Core or Component feature. Browser APIs belong to target-specific packages, while application policy such as caching and update behavior must remain configurable rather than hidden inside the reactive runtime.

## Native applications

A future Lilium Native platform may target native host controls through a dedicated renderer adapter. Shared reactive state, ownership, headless components, and target-independent templates should remain reusable where their accepted contracts are sufficient.

Native rendering must not be implemented by adding native concepts to universal packages or by assuming DOM emulation. A native package boundary should be proposed only after the renderer protocol can represent its required host capabilities without browser-specific assumptions.

## Deferred decisions

- Define the minimum static-site input, route, content, build, and output model.
- Decide whether static generation supports incremental builds, data loading, and deployment adapters.
- Define the supported PWA installation, offline, update, and service-worker integration boundaries.
- Identify the first native host and prove renderer-protocol compatibility through conformance scenarios.
- Decide how `.lily` templates express target capabilities without becoming target-specific source files.
