# `@lilium/compiler`

Pure deterministic source-to-source compiler for Lilium `.lily` files.

Status: **First compiler milestone complete**

The package accepts explicit source text and options and will emit readable ES2022 ESM targeting
public Component and Template ABIs. It owns no file-system access, module loading, renderer,
platform adapter, or runtime helper.

The package root exposes public contracts and the frozen stateless `Compiler` facade. `compile()`
runs the internal lexer, recoverable parser, semantic analyzer, IR lowering, deterministic ESM
generator, and source-map encoder without filesystem or runtime access.

Committed golden fixtures verify deterministic output and diagnostics, strict generated-JavaScript
compatibility with public packages, and representative execution through Renderer Console.

- [Package documentation](https://github.com/BlueLuscious/lilium/tree/master/docs/en/packages/compiler)
- [Compiler conformance](https://github.com/BlueLuscious/lilium/tree/master/docs/en/packages/compiler/conformance)
- [Lily Compiler Boundary](https://github.com/BlueLuscious/lilium/blob/master/docs/en/architecture/lily-compiler-boundary.md)

## License

ISC
