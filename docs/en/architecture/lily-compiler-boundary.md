# Lily Compiler Boundary

Status: **Foundation accepted**

This document defines the first `.lily` source boundary and deterministic compiler output. The
compiler targets the accepted Component and [Template ABI](template-abi.md) package roots and never
participates in runtime execution.

## Milestone decision

The first compiler implementation is a separate epic after the programmatic Template, Core and
Component integration bridges, Renderer runtime, and console conformance pipeline are working.
Compiler implementation does not block the first programmatic runnable framework milestone.

This ordering validates the public ABI before generated code depends on it. The compiler remains a
required Lilium authoring milestone, but it is not bundled into Template or Renderer implementation
and cannot force unverified runtime contracts to stabilize early.

## Compiler package boundary

`@lilium/compiler` is a pure source-to-source library. It receives source text and an explicit file
name and returns generated ES2022 ESM, a source map, and structured diagnostics. It performs no file
system access, module loading, process termination, logging, package installation, or host
rendering.

The package exports one frozen stateless `Compiler` facade implementing `CompilerApi`. Its minimum
operation is conceptually:

```ts
Compiler.compile(source, { filename });
```

The result contains:

- `code`, generated JavaScript when no error diagnostic exists;
- `map`, a version 3 source map when code exists;
- `diagnostics`, an immutable ordered collection of compiler diagnostics.

Build tools, CLIs, editors, and future bundler integrations own file I/O, module resolution,
diagnostic presentation, caching, and process exit status. A Node-hosted adapter may wrap the pure
compiler without moving Node APIs into its contracts.

Invalid API arguments may throw synchronously. Invalid `.lily` source, unsupported syntax, and
source-level semantic failures return diagnostics and do not throw. An unexpected compiler
invariant failure may throw because it represents an implementation defect rather than a user
program.

## First source model

The first milestone compiles a visual definition and composes it with one imported headless
`ComponentDefinition`. It does not define setup behavior inside `.lily`.

One source file contains these ordered top-level declarations:

1. Exactly one `behavior` named import.
2. One or more `primitives` named imports.
3. One or more `properties` named imports.
4. Exactly one `template` block.

Comments use ECMAScript line and block comment forms. Module specifiers are non-empty string
literals and are preserved exactly in generated ESM.

The minimum grammar is:

```ebnf
file                = behavior-import, capability-import*, template-section, end-of-file;
behavior-import     = "behavior", named-list, "from", string-literal, ";";
capability-import   = ("primitives" | "properties"), named-list, "from",
                      string-literal, ";";
named-list          = "{", identifier, (",", identifier)*, [","], "}";
template-section    = "template", block;
block               = "{", declaration*, "}";
declaration         = node-declaration | value-declaration | binding-declaration;
node-declaration    = "node", identifier, block;
value-declaration   = "value", identifier, "=", literal-expression, ";";
binding-declaration = "bind", identifier, "=", binding-expression, ";";
```

Only `node` declarations are valid directly inside `template`. `value` and `bind` declarations are
valid only inside a node and target a property imported through `properties`.

A node identifier must come from `primitives`. A node may contain property declarations followed
by child nodes. Defining the same property more than once on one node is invalid, regardless of
whether the duplicates use `value` or `bind`.

All imports precede `template`. Local import names share one namespace and cannot collide with one
another or compiler-reserved generated identifiers.

## Expressions

`value` accepts an immutable literal expression composed from:

- string, numeric, boolean, and null literals;
- template literals without substitutions;
- array and object literals recursively containing accepted literal expressions.

Static values cannot reference component state or imported executable values.

`bind` accepts a restricted synchronous derivation expression composed from:

- accepted literal expressions;
- the reserved roots `inputs` and `controller`;
- property access from those roots;
- zero-argument `.get()` signal reads;
- unary, arithmetic, comparison, logical, nullish, and conditional operators;
- template literals whose substitutions are accepted binding expressions;
- array and object literals recursively containing accepted binding expressions;
- a method or callback property reference without invocation.

Assignments, update operators, arbitrary calls, `new`, `await`, `yield`, functions, classes,
arrows, spread, and statements are invalid. In particular, `controller.increment` may be supplied
as a callback-valued property, while `controller.increment()` is rejected because binding
evaluation cannot execute component commands.

The only call accepted by the first expression grammar is zero-argument `.get()` on a path rooted
at `inputs` or `controller`. Runtime purity remains a contract, but this restricted grammar removes
the most direct side-effect forms before code generation.

All generated bindings use default `Object.is` equality. Custom binding equality has no first-
milestone source syntax.

## Smallest useful source

The following component displays reactive state and supplies a controller command to an action
primitive without embedding setup behavior in the template file:

```lily
behavior { CounterBehavior } from "./counter.behavior.js";

primitives { Stack, Label, Action } from "@example/primitives";
properties {
    StackGap,
    LabelValue,
    ActionLabel,
    ActionActivate,
} from "@example/primitives";

template {
    node Stack {
        value StackGap = 8;

        node Label {
            bind LabelValue = `Count: ${controller.count.get()}`;
        }

        node Action {
            value ActionLabel = "Increment";
            bind ActionActivate = controller.increment;
        }
    }
}
```

`CounterBehavior` is authored through `Component.define()` in an ordinary TypeScript or JavaScript
module. `Stack`, `Label`, `Action`, and their property identities come from a primitive library and
remain target-independent capability objects.

## Generated module

The conceptual output is readable ES2022 ESM targeting only public package exports:

```js
// Generated by @lilium/compiler. Do not edit.
import { Template } from "@lilium/template";
import { CounterBehavior } from "./counter.behavior.js";
import {
    Action,
    ActionActivate,
    ActionLabel,
    Label,
    LabelValue,
    Stack,
    StackGap,
} from "@example/primitives";

const $template = Template.define({
    roots: [
        Template.node(Stack, {
            properties: [Template.value(StackGap, 8)],
            children: [
                Template.node(Label, {
                    properties: [
                        Template.binding(
                            LabelValue,
                            ($state) => `Count: ${$state.controller.count.get()}`,
                        ),
                    ],
                }),
                Template.node(Action, {
                    properties: [
                        Template.value(ActionLabel, "Increment"),
                        Template.binding(
                            ActionActivate,
                            ($state) => $state.controller.increment,
                        ),
                    ],
                }),
            ],
        }),
    ],
});

export default Template.compose(CounterBehavior, $template);
```

The compiler emits only:

- `Template` from `@lilium/template`;
- the declared behavior export from its source module;
- declared primitive and property exports from their source modules.

It imports no Renderer package, integration subpath, Component implementation, Template
implementation path, Core implementation, compiler runtime helper, or platform adapter.

The compiler does not import `Component` in this milestone because it does not emit setup behavior.
The imported behavior is already a public `ComponentDefinition`, and `Template.compose()` owns the
generated default export.

Imports from the same user module are merged. Framework imports appear first, user modules follow
first source appearance, and named specifiers are emitted in lexical order. The generated module
contains one final newline and normalized LF line endings.

## Parsing and analysis

Compilation has explicit stages:

1. Lex source text while preserving comments and source offsets needed for diagnostics.
2. Parse a recoverable concrete source tree.
3. Analyze top-level cardinality, local symbols, declaration placement, property uniqueness, and
   expression restrictions.
4. Lower valid source into a normalized compiler IR that mirrors Template ABI concepts.
5. Generate deterministic ESM and a source map from that IR.

The parser synchronizes after semicolons, closing braces, and recognized top-level declaration
keywords so one malformed declaration does not suppress independent later diagnostics.

The first compiler does not load imported modules or execute capability objects. It verifies that
each referenced local symbol was declared in the correct source import category. This milestone
does not statically prove external property ownership or generic value compatibility; public
Template definition validation enforces observable capability identity when the module executes. A
future module-metadata resolver or language tool may add stronger source diagnostics without
changing emitted ABI semantics.

No generated code is returned when any error diagnostic exists. Warnings, if introduced, do not
prevent output.

## Diagnostics

Each immutable compiler diagnostic contains:

- a stable `LILY`-prefixed code;
- severity, initially `error`;
- a concise message without terminal formatting;
- the explicit source filename;
- one primary source range;
- zero or more related source ranges.

Ranges store zero-based UTF-16 offsets. Human-facing locations additionally expose one-based line
and column numbers. CRLF counts as one line break, and columns count UTF-16 code units. Build and
editor adapters may render ranges differently without changing compiler diagnostics.

Diagnostics are ordered by primary start offset, then end offset, then code. The same input and
compiler version must produce byte-identical diagnostics.

Initial diagnostic families are reserved by stage:

| Range | Responsibility |
| --- | --- |
| `LILY1xxx` | Lexing and parsing. |
| `LILY2xxx` | Local symbols and source semantics. |
| `LILY3xxx` | Unsupported first-milestone features. |
| `LILY9xxx` | Compiler API and invariant diagnostics when representable as results. |

### Diagnostic examples

Missing punctuation:

```lily
value StackGap = 8
```

```text
LILY1004: Expected ';' after static property value.
```

Unknown primitive category:

```lily
template {
    node Missing {}
}
```

```text
LILY2003: 'Missing' is not an imported primitive.
```

Duplicate property:

```lily
node Label {
    value LabelValue = "Initial";
    bind LabelValue = controller.label.get();
}
```

```text
LILY2011: Property 'LabelValue' is already defined on this node.
```

Impure call:

```lily
bind ActionActivate = controller.increment();
```

```text
LILY3002: Binding expressions cannot invoke component commands.
```

Unsupported structural syntax:

```lily
if controller.visible.get() {
    node Label {}
}
```

```text
LILY3005: Conditional regions are not supported by the first compiler milestone.
```

## Source maps and readability

The compiler emits source-map version 3 with:

- the caller-provided filename normalized to forward slashes;
- `sourcesContent` containing the original `.lily` source;
- mappings for imports, primitive declarations, static values, binding expressions, and the default
  composition export;
- no absolute workspace path, timestamp, machine identifier, or nondeterministic hash.

Generated helper punctuation may remain unmapped. Binding expression mappings must point to their
original expression spans so runtime stacks and build diagnostics can return to useful `.lily`
locations.

Development and production compilation share the same semantic output in the first milestone. The
compiler performs no minification, mangling, dead-code elimination, or target downleveling.
Downstream build tools may transform the readable ES2022 module and compose source maps.

## Deterministic fixtures

The compiler implementation epic must use fixture directories containing:

- `input.lily`;
- `expected.js` when compilation succeeds;
- `expected.map.json` when compilation succeeds;
- `expected.diagnostics.json` for valid and invalid inputs.

Minimum golden fixtures cover:

- the smallest useful component shown above;
- multiple root primitives;
- nested primitives with static and dynamic properties;
- callback property references;
- comments and CRLF source normalization;
- missing and duplicate top-level sections;
- unknown primitive and property symbols;
- duplicate node properties;
- malformed and forbidden binding expressions;
- every explicitly unsupported structural keyword.

Every fixture compiles twice in one test and compares code, map, and diagnostics byte-for-byte.
Golden updates require an intentional review because generated output is a public compatibility
boundary for build integrations and debugging.

## Explicitly deferred source features

The first milestone excludes:

- inline setup, script, state, input, or controller declarations;
- TypeScript syntax and external-module type checking inside `.lily`;
- direct `Component.define()` generation;
- nested templated components, component-input mapping, slots, and projections;
- conditional regions, keyed repetition, dynamic fragments, and anchors;
- arbitrary calls, inline callbacks, asynchronous expressions, and resources;
- markup or HTML-like syntactic sugar;
- built-in elements, attributes, events, or platform names;
- styles, scoped styles, CSS processing, and asset imports;
- transitions, animations, portals, and hydration;
- preprocessors, macros, plugins, hot-module replacement, and incremental compilation;
- declaration-file generation and editor language services.

These features may extend the source grammar only after their target public ABI exists. Source sugar
must lower to the same normalized Template declarations rather than introducing alternative runtime
semantics.

## Minimum concept families

When the compiler package epic is created, one principal concept per file remains mandatory:

- `api`: `CompilerApi` and the frozen `Compiler` facade;
- `source`: source text, filename, offsets, locations, and ranges;
- `diagnostic`: diagnostics, severity, related ranges, and stable codes;
- `lexer`: tokens and trivia;
- `parser`: concrete source declarations and recovery;
- `analysis`: symbols, semantic validation, and unsupported-feature checks;
- `ir`: normalized compiler-only Template declaration representation;
- `generator`: deterministic ESM and source-map generation.

Parser trees, compiler IR, and generator implementation types are internal. Public consumers receive
only compiler options, result, diagnostics, code, and source-map contracts.

## Dependency and execution proof

The compiler library may depend on public type contracts from Component and Template for its own
implementation, but generated code imports only the Template package root and user-declared public
modules. Runtime packages never import Compiler and never parse `.lily` source.

```text
.lily source --> compiler --> ES2022 ESM --> component + template public ABIs

core/component/template/renderer runtime -X-> compiler
```

Programmatic and compiled templates therefore instantiate through the same Template definitions,
Renderer protocol, integration capabilities, ownership, scheduling, errors, and disposal behavior.
