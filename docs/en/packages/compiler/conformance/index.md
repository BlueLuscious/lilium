# Compiler Conformance

Status: **Implemented**

Compiler conformance freezes the first `.lily` milestone as reviewable source, JavaScript,
source-map, and diagnostic fixtures. It verifies the complete public pipeline without adding file
system access or runtime dependencies to compiler production code.

## Golden Fixture Contract

Every fixture directory contains:

- `input.lily`, read without line-ending normalization;
- `expected.diagnostics.json`, present for successful and unsuccessful compilation;
- `expected.js`, present only for successful compilation;
- `expected.map.json`, present only for successful compilation.

The harness discovers fixture directories, compiles every source twice with the same explicit
filename, and compares complete serialized results for byte stability. It then compares code and
JSON artifacts against their committed golden files. Updating generated behavior therefore
produces an ordinary reviewable repository diff rather than an implicit snapshot rewrite.

The first matrix covers:

- the smallest useful nested component;
- multiple roots and merged imports in deterministic source order;
- nested static values, reactive bindings, and callback references;
- recursive literal values;
- exact CRLF source retention with LF generated output;
- missing and duplicate top-level declarations;
- unknown primitive and property symbols;
- duplicate node properties;
- malformed and forbidden binding forms;
- every explicitly deferred structural keyword.

The canonical grammar and diagnostic vocabulary remain defined by the
[Lily Compiler Boundary](../../../architecture/lily-compiler-boundary.md). Stage-specific behavior
is documented by [Lexer](../lexer/index.md), [Parser](../parser/index.md),
[Analysis](../analysis/index.md), [Generator](../generator/index.md), and
[Source Map](../source-map/index.md).

## Generated Module Verification

Successful `expected.js` files are checked as JavaScript with TypeScript `checkJs` enabled against
the built public Component and Template package exports. Generated `$template` declarations use
`ComponentTemplateStateFromDefinitionType<typeof Behavior>` so binding state is derived from the
imported headless definition without runtime type imports or erased `any` state.

This check proves that generated modules:

- resolve only declared public package paths;
- satisfy exact Component input and controller state relationships;
- call the current public Template ABI with compatible values;
- remain standalone ES2022 ESM with no compiler runtime dependency.

## Runtime Verification

The representative smallest-useful golden module is imported as generated, mounted through the
public Renderer facade, and executed by the private Renderer Console host. The test observes the
initial logical tree, invokes the generated callback-backed controller command, verifies the
reactive host update, and disposes the rendered component and Core runtime.

This runtime case proves the complete implemented path:

```text
.lily source
  -> Compiler
  -> generated public-ABI ESM
  -> Component + Template composition
  -> Renderer
  -> Renderer Console host
```

Compiler itself still performs none of these runtime operations. Conformance owns the external
dependencies strictly as package-local development dependencies.
