# `@lilium/compiler`

Pure deterministic source-to-source compiler for Lilium `.lily` files.

Status: **Lexer and recoverable parser implemented**

The package accepts explicit source text and options and will emit readable ES2022 ESM targeting
public Component and Template ABIs. It owns no file-system access, module loading, renderer,
platform adapter, or runtime helper.

The package root currently exposes contracts and types only. Its internal deterministic lexer and
recoverable parser are implemented, while the frozen `Compiler` runtime facade remains deferred
until analysis and generation complete the real pipeline.

- [Package documentation](https://github.com/BlueLuscious/lilium/tree/master/docs/en/packages/compiler)
- [Lily Compiler Boundary](https://github.com/BlueLuscious/lilium/blob/master/docs/en/architecture/lily-compiler-boundary.md)

## License

ISC
