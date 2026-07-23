# `@lilium/compiler`

Pure deterministic source-to-source compiler for Lilium `.lily` files.

Status: **Public compiler boundary declared**

The package accepts explicit source text and options and will emit readable ES2022 ESM targeting
public Component and Template ABIs. It owns no file-system access, module loading, renderer,
platform adapter, or runtime helper.

Phase 00 declares contracts and types only. The frozen `Compiler` runtime facade will be exported
after the real lexer, parser, analysis, and generation pipeline exists.

- [Package documentation](https://github.com/BlueLuscious/lilium/tree/master/docs/en/packages/compiler)
- [Lily Compiler Boundary](https://github.com/BlueLuscious/lilium/blob/master/docs/en/architecture/lily-compiler-boundary.md)

## License

ISC
