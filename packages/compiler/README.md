# `@lilium/compiler`

Pure deterministic source-to-source compiler for Lilium `.lily` files.

Status: **Analysis and normalized IR implemented**

The package accepts explicit source text and options and will emit readable ES2022 ESM targeting
public Component and Template ABIs. It owns no file-system access, module loading, renderer,
platform adapter, or runtime helper.

The package root currently exposes contracts and types only. Its internal lexer, recoverable
parser, semantic analyzer, and normalized IR are implemented, while the frozen `Compiler` runtime
facade remains deferred until generation completes the real pipeline.

- [Package documentation](https://github.com/BlueLuscious/lilium/tree/master/docs/en/packages/compiler)
- [Lily Compiler Boundary](https://github.com/BlueLuscious/lilium/blob/master/docs/en/architecture/lily-compiler-boundary.md)

## License

ISC
