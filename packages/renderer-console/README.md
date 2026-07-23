# `@lilium/renderer-console`

Private logical host adapter and conformance infrastructure for Lilium Renderer.

Status: **Shared Renderer conformance verified**

This workspace-only package implements public `@lilium/renderer` host contracts with deterministic
logical handles, structured operation traces, capability omissions, and operation-specific failure
injection. It passes the reusable `@lilium/renderer/conformance` suite and remains independent from
Renderer implementation modules. It is not a terminal UI library and has no publication contract.

- [Package documentation](https://github.com/BlueLuscious/lilium/tree/master/docs/en/packages/renderer-console)
- [Renderer protocol](https://github.com/BlueLuscious/lilium/blob/master/docs/en/architecture/renderer-protocol.md)

## License

ISC
