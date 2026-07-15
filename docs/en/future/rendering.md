# Rendering Modes

Status: **Future candidate**

Lilium's universal renderer protocol must remain independent from a particular execution host. Client-side rendering and server-side rendering are separate adapters and execution models built on the same accepted Template ABI.

## Client-side rendering

CSR belongs to a browser renderer such as `@lilium/renderer-dom`. It will own browser mounting, host updates, events, and unmounting without moving DOM contracts into Core, Component, Template, or the universal Renderer package.

## Server-side rendering

SSR belongs to a server renderer such as `@lilium/renderer-server`. It will own serialization and server execution without introducing server globals or streaming assumptions into target-independent packages.

## Deferred decisions

- Define whether the first SSR milestone is synchronous serialization, asynchronous serialization, or streaming.
- Define hydration as an explicit protocol between compatible server output and a client renderer.
- Define state transfer, identifier stability, mismatch diagnostics, and partial hydration separately.
- Decide whether CSR and SSR share conformance fixtures beyond the universal host protocol.

These decisions follow the Template and Renderer foundation. Their future package placement is tracked in [Future Packages](packages.md).
