# Compiler Generator

Status: **Implemented internally**

The generator consumes only error-free normalized compiler IR and emits readable deterministic
ES2022 ESM through the public `@lilium/template` package root. It performs no semantic validation,
module loading, bundling, runtime execution, or platform work.

## Contracts And Types

| Contract or type | Responsibility | Relationships |
| --- | --- | --- |
| `TCompilerImportGroup` | Aggregate unique local names from one user module during generation. | Created from ordered `ICompilerImportIr` declarations. |

Generation classes remain internal and absent from `@lilium/compiler`.

## Generation Flow

1. Emit the fixed public `Template` import.
2. Merge user imports by exact module specifier in first source-appearance order.
3. Sort each merged named-specifier list lexically.
4. Derive the exact visual state from the imported behavior through the public
   `ComponentTemplateStateFromDefinitionType`.
5. Emit one typed `$template` definition containing normalized roots, properties, and children.
6. Emit static properties through `Template.value()`.
7. Emit bindings through `Template.binding()` and qualify executable roots through `$state`.
8. Compose the imported behavior and generated template as the default export.
9. Finish with exactly one LF and no environment-dependent metadata.

`LilyBindingEmitter` rewrites only executable `inputs` and `controller` roots. It preserves strings,
comments, member names, object keys, and template text, while recursively rewriting expressions
inside template substitutions.

`GeneratedSourceWriter` advances generated UTF-16 line and column state while writing code. Mappings
are recorded at user imports, primitive names, property names, expression starts, and the final
behavior composition.

The generator imports no Component implementation, Renderer, Core, compiler helper, integration
subpath, or host adapter. Its JSDoc state annotation is erased runtime metadata that allows the
generated JavaScript itself to pass strict `checkJs` validation against public package contracts.
