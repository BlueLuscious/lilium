# `@lilium/renderer`

Target-independent Template execution and host rendering protocol for Lilium.

Status: **First public ABI and shared conformance boundary complete**

Renderer depends on `@lilium/core`, `@lilium/component`, and `@lilium/template`. It defines universal application, host, capability, placement, runtime, and error boundaries without depending on DOM, console, server, or native APIs.

Reusable host-adapter scenarios are available from the opt-in
`@lilium/renderer/conformance` developer subpath without enlarging the package root facade.

- [Package documentation](https://github.com/BlueLuscious/lilium/tree/master/docs/en/packages/renderer)
- [Renderer protocol](https://github.com/BlueLuscious/lilium/blob/master/docs/en/architecture/renderer-protocol.md)
- [Package boundaries](https://github.com/BlueLuscious/lilium/blob/master/docs/en/architecture/package-boundaries.md)

## License

ISC
