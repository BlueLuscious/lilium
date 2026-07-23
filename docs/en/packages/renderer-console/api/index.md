# Renderer Console API

Status: **Implemented for private host construction**

| Contract or object | Responsibility | Relationships |
| --- | --- | --- |
| `RendererConsoleApi` | Declare primitive capabilities and create reusable logical hosts. | Implemented by the frozen `RendererConsole` object. |
| `RendererConsole` | Provide the package's only runtime root value. | Delegates declarations to Capability and host construction to Host. |

`primitive()` accepts an exact public Template primitive identity indirectly through Renderer host
types. Its options declare child support and exact properties without importing Template in
production. `createHost()` accepts only nominal declarations produced by the same package facade.

The facade is intentionally private infrastructure rather than a stable framework API. It creates
no Core runtime, Renderer runtime, external root, or host session until application code supplies
the resulting host to `Renderer.createRuntime()` and mounts a definition.
