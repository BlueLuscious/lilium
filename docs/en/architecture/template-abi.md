# Template ABI

Status: **First public ABI implemented and verified**

This document defines the canonical target-independent Template ABI for programmatic authoring and
compiled `.lily` output. It defines immutable presentation declarations only. Runtime execution and
host operations belong to Renderer.

## Design goals

The minimum ABI must:

- describe stable structure without retaining a mutable virtual tree;
- isolate reactive work into independently tracked bindings;
- compose with headless `ComponentDefinition` values without modifying them;
- support host-neutral primitive capabilities instead of built-in element or platform names;
- give programmatic definitions and compiler output identical observable semantics;
- preserve explicit ownership and deterministic disposal through the accepted
  [Rendering Integration](rendering-integration.md) boundary.

The minimum ABI does not include conditional regions, keyed repetition, asynchronous content,
portals, transitions, hydration, or host-specific event syntax. These require separate instruction
families after the static, binding, component, and slot lifecycles are implemented and verified.

## Public object model

`@lilium/template` exports one frozen stateless `Template` object implementing `TemplateApi`.
Its operations create normalized immutable definition objects; they never capture a runtime,
renderer, host, owner, or mounted occurrence.

The minimum public identity-bearing objects are:

| Object | Responsibility |
| --- | --- |
| `TemplateDefinition<State>` | Reusable immutable program evaluated against one read-only state object per occurrence. |
| `TemplatePrimitive<Properties>` | Portable identity for one host capability understood by compatible adapters. |
| `TemplateProperty<Primitive, Value>` | Typed identity for one value accepted by a primitive. |
| `TemplateSlot<Inputs>` | Stable named projection point and slot-input schema. |
| `TemplatedComponentDefinition<Inputs, Controller>` | Immutable composition of one headless component and one compatible template. |

Primitive, property, slot, template, and composed-component identities are compared by object
identity. Optional immutable diagnostic names do not participate in equality.

Definition records such as nodes, static property values, bindings, nested components, outlets,
and projections are immutable protocol values. They have no independent runtime lifecycle and are
not public constructors.

The facade operations are conceptually:

- `Template.primitive()` creates a primitive capability identity;
- `Template.property()` creates a property identity owned by one primitive;
- `Template.slot()` creates a named slot identity;
- `Template.node()`, `Template.value()`, `Template.binding()`, `Template.component()`, and
  `Template.outlet()` create declaration records;
- `Template.projection()` creates a typed parent-owned projection declaration;
- `Template.define()` validates, copies, normalizes, and freezes one complete program;
- `Template.compose()` creates a separate component-template composition.

Concrete overloads and generic spelling are defined by the public package contracts. These objects
and semantic operations form the verified first Template ABI.

## Immutable program

A `TemplateDefinition<State>` contains an ordered root fragment. A fragment contains zero or more
declarations of these minimum kinds:

1. Primitive node.
2. Nested templated component.
3. Slot outlet.

A primitive node references one `TemplatePrimitive`, contains ordered static property values and
dynamic property bindings, and may contain an ordered child fragment. The ABI defines neither a
built-in text primitive nor platform element names. Primitive libraries export capability objects,
and host adapters explicitly declare which objects they implement.

A static property value is applied once during instantiation. A dynamic binding evaluates once
during instantiation and again only when one of its reactive dependencies invalidates it.

`Template.define()` copies caller-provided arrays and records into a normalized frozen program. It
does not recursively freeze caller-owned objects supplied as property values. Functions and opaque
application values are retained by reference, while the declaration containers owned by Template
cannot be mutated after definition.

### Stable references

Normalization assigns a deterministic definition-local reference to every primitive node, nested
component, slot outlet, and binding. References are structural ordinals, not user keys, host
handles, global identifiers, or runtime objects.

The compiler emits declarations in deterministic source order and therefore produces the same
references as equivalent programmatic input. Renderer resolves each reference to occurrence-local
host or lifecycle state during mount. It stores only the handles required by bindings and disposal;
it does not create a mutable copy of the complete definition graph.

Future keyed repetition will introduce explicit data identity separately. It must not overload
definition-local references with collection-item identity.

## Primitive capabilities

A `TemplatePrimitive<Properties>` is an opaque portable capability token. It contains no host
creation callback and imports no Renderer contract. A `TemplateProperty<Primitive, Value>` belongs
to exactly one primitive and carries its value type.

This design allows a library to publish semantic primitives such as a stack, label, or action
without selecting a target implementation. A browser, server, console, or native adapter may map
the same primitive identities to different host values when it supports their semantics. A target-
specific primitive library is also valid, but templates importing it are intentionally portable
only to adapters that implement those capabilities.

Unsupported primitives or properties are mount-time capability errors. Silent property omission
or name-based fallback is not allowed.

Events are not a special Template ABI concept. A primitive may define a callback-valued property,
and its host adapter defines when and how that callback is invoked. Platform event objects cannot
enter the universal Template contracts unless represented by a separately accepted portable type.

## Template state

`State` is one read-only object supplied by Renderer when a template occurrence is created.
Template definitions do not receive `ReactiveRuntime`, `Scope`, Renderer, host values, or mutable
integration capabilities.

For a composed headless component, Renderer constructs one frozen component-template state with:

- `inputs`, the exact stable `ComponentInputsType<Inputs>` object;
- `controller`, the exact read-only `ComponentControllerType<Controller>` object.

This state is represented by a public declaration-only
`ComponentTemplateStateType<Inputs, Controller>`. A standalone root template may use another
explicit state object supplied by its mounting composition.

There is no template setup callback. Headless behavior and owned state initialization belong to
Component setup. Template runtime allocation belongs to Renderer. The only executable functions
stored by the minimum Template ABI are pure synchronous binding evaluators.

## Dynamic bindings

A property binding contains:

- one definition-local binding identity;
- one target primitive reference;
- one property identity belonging to that primitive;
- one synchronous evaluator from the occurrence state to the property value;
- an optional equality operation, defaulting to `Object.is`.

Each binding occurrence becomes one Core render-phase reactive consumer. Its first evaluation is
synchronous during mount. A successful evaluation commits its reactive dependencies and candidate
value. Later invalidations are deduplicated by Core and reevaluate only that binding.

If a candidate compares equal to the last committed value, Renderer preserves the existing host
value and performs no host property operation. Equality executes untracked. If equality throws,
the candidate is rejected and normal binding failure handling applies.

Binding evaluators must be synchronous and observationally pure. They may read signals and derive
values. They must not write reactive state, allocate owned resources, mutate host values, return a
Promise-like value, or invoke controller commands as part of evaluation. A callback intended for a
primitive property may close over and invoke a controller command later when the host invokes that
callback.

Dependency collection is transactional. An evaluator failure does not commit candidate
dependencies or a candidate property value. Renderer then applies the terminal failure semantics
defined by its protocol; the failed binding may not execute again accidentally.

## Component composition

`Template.compose(component, template)` returns a frozen
`TemplatedComponentDefinition<Inputs, Controller>` and does not mutate either supplied definition.
The template state must be compatible with
`ComponentTemplateStateType<Inputs, Controller>`.

A headless component may be exported and used without a template. The same component may be
composed with multiple templates, and the same compatible template may be composed with multiple
component definitions. Neither definition gains an optional reference to the other.

A nested component declaration references one `TemplatedComponentDefinition` and one complete
input declaration. Static inputs are copied into an immutable snapshot and applied once during
instantiation. Dynamic inputs retain a synchronous evaluator that receives the parent template
state and returns a complete `ComponentInputValuesType<ChildInputs>` snapshot, including
`undefined` for cleared optional keys. Renderer tracks only the dynamic form as one render binding
and forwards every accepted snapshot through the Component integration capability. Child setup
never reruns.

Nested headless `ComponentDefinition` values cannot appear directly in visual structure because
they provide no template to instantiate. They must first be composed with a template.

## Slots and projection

A `TemplateSlot<Inputs>` is a stable object identity with an immutable diagnostic name. Omitting
the name creates a new identity named `"default"`; it does not reuse a package-global singleton.
A child template places that identity through one slot-outlet declaration. A composed component
exposes its accepted slots as an immutable name-to-identity map for programmatic authoring,
compiler analysis, and diagnostics. `Template.define()` rejects repeated slot identities and
distinct slot identities with the same normalized name across the complete definition, including
fallback fragments.

An outlet defines:

- the slot identity;
- a complete slot-input evaluator derived from child template state;
- an optional fallback fragment evaluated against child state.

A parent nested-component declaration may provide one projection definition for each accepted slot
identity. `Template.projection()` preserves the slot-input-to-projection-state type relationship
and creates a genuine immutable declaration. `Template.component()` copies projections in
declaration order and rejects repeated, structurally imitated, or unaccepted declarations.
Projection content evaluates against a frozen `TemplateProjectionStateType` containing:

- `parent`, the supplying parent template state;
- `slot`, a stable object of read-only reactive slot-input signals.

Renderer creates the slot-input signals from the complete initial snapshot and updates them in one
Core batch. Optional slot inputs remain present and use `undefined`, matching component input
semantics.

### Projection ownership

Projected content retains the semantic owner of the supplying parent template. Renderer creates a
projection scope beneath the parent attachment, even though its host values are inserted at a child
outlet. The child outlet registers an idempotent lease cleanup that disposes that projection scope
when the outlet disappears.

This dual link has deterministic behavior:

- disposing the parent disposes its projected content and removes its host values;
- disposing the child first invokes the outlet lease and disposes the parent-owned projection;
- the later disposal path observes an already disposed projection and does nothing;
- context lookup and error traversal for projected bindings follow the supplying parent;
- fallback content follows the receiving child because it is declared by the child template.

For the minimum ABI, projection presence is static per nested-component declaration. An omitted
projection instantiates fallback content when present; otherwise the outlet is empty. Dynamically
switching between projection and fallback requires a future structural region instruction.

## Lifecycle

### Definition

Definition and composition validate synchronously, allocate no runtime resource, and remain
reusable across runtimes and renderers. Observable invalid definitions throw before any ownership
or host work exists.

### Instantiation

Renderer performs one depth-first instantiation of the immutable declarations:

1. Preflight every reachable primitive, property, and parent-child requirement before Component
   setup or host mutation.
2. Create primitive host values and apply static properties.
3. Evaluate and apply initial dynamic bindings.
4. Create nested component occurrences through Component integration.
5. Instantiate supplied projection or child-owned fallback content at each slot outlet.
6. Publish the rendered occurrence only after the complete initial attempt succeeds.

The Renderer Protocol may refine host-operation ordering where parent creation and insertion differ,
but it may not defer successful initial binding evaluation beyond mount completion.

### Update

Template definitions and static structure are never reevaluated as a whole. Core schedules only
invalidated property, component-input, or slot-input bindings. Multiple invalidations before a
flush deduplicate by binding identity, and render work completes before eligible user effects.

### Disposal

Disposal cancels bindings before releasing their target host values, disposes nested component and
projection occurrences, and follows the attachment-before-component ordering from
[Rendering Integration](rendering-integration.md#ownership-topology). Repeated disposal is safe.

## Failure scenarios

Definition validation failures are direct synchronous API errors because no semantic owner exists.

Unsupported-capability preflight failures belong to the application owner and occur before
Component setup or host mutation. Initial binding, nested-component, projection, fallback, and host
failures belong to the attachment currently being instantiated. A handled failure still aborts
that occurrence and releases partial work. A propagated failure preserves the original error
before any propagated cleanup failure.

Dynamic evaluator or property-application failure terminalizes the complete rendered occurrence
that owns its binding before normal ownership boundary traversal. This accepted
[Renderer Protocol](renderer-protocol.md#dynamic-binding-or-host-failure) prevents sibling bindings
from continuing against an inconsistent host subtree.

Projected-content errors traverse the supplying parent ownership chain. Fallback-content errors
traverse the receiving child chain. Cleanup attempts every resource and aggregates only unhandled
failures according to Core ownership semantics.

## Programmatic example

The following example is conceptual TypeScript. `Stack` and `Label` are portable primitive
capabilities supplied by an independent UI primitive library, not built into Template.

```ts
const Stack = Template.primitive("Stack");
const StackGap = Template.property<number>(Stack, "gap");
const Label = Template.primitive("Label");
const LabelValue = Template.property<string>(Label, "value");

const CounterView = Template.define<ComponentTemplateStateType<
    CounterInputs,
    CounterController
>>({
    roots: [
        Template.node(Stack, {
            properties: [Template.value(StackGap, 8)],
            children: [
                Template.node(Label, {
                    properties: [
                        Template.binding(LabelValue, ({ controller }) =>
                            `Count: ${controller.count.get()}`,
                        ),
                    ],
                }),
            ],
        }),
    ],
});

export const Counter = Template.compose(CounterBehavior, CounterView);
```

The definition creates no host value. Every occurrence instantiates the stack and label once, and
only the label-value binding reevaluates when `controller.count` changes.

## Conceptual compiler output

The accepted [Lily Compiler Boundary](lily-compiler-boundary.md) defines the first source grammar.
For a source component equivalent to the programmatic example, the compiler emits a normal ESM
module targeting the same objects:

```ts
import { Template } from "@lilium/template";
import { Stack, StackGap, Label, LabelValue } from "@example/primitives";
import { CounterBehavior } from "./counter.behavior.js";

const template = Template.define({
    roots: [
        Template.node(Stack, {
            properties: [Template.value(StackGap, 8)],
            children: [
                Template.node(Label, {
                    properties: [
                        Template.binding(LabelValue, ($state) =>
                            `Count: ${$state.controller.count.get()}`,
                        ),
                    ],
                }),
            ],
        }),
    ],
});

export default Template.compose(CounterBehavior, template);
```

The compiler may hoist immutable declaration records or emit a more compact normalized form only
when that form is an approved public Template ABI and preserves the same references, evaluation
order, equality, ownership, errors, and disposal behavior.

## Minimum concept families

When the package implementation epic is created, contracts and types must remain organized by
feature and one principal concept per file:

- `api`: `TemplateApi` and the frozen `Template` facade;
- `definition`: `TemplateDefinition`, fragments, normalized references, and definition state;
- `primitive`: `TemplatePrimitive`, `TemplateProperty`, and static property values;
- `binding`: property bindings, evaluators, equality, and internal committed binding state;
- `component`: component-template state, nested component declarations, and
  `TemplatedComponentDefinition`;
- `slot`: slot identities, outlets, projections, slot inputs, and projection state.

Runtime occurrence, host handle, mounting, reconciliation, and host cleanup concepts do not belong
to `@lilium/template`; they belong to Renderer.

## Dependency proof

Template imports public declaration contracts and types from Core and Component only. It does not
import either integration subpath because definitions do not execute. It imports no Renderer,
Compiler, host adapter, platform global, or implementation path.

Renderer imports Template definitions and owns their execution. Compiler emits imports from the
Template and Component package roots. No dependency points from Template toward its consumers, so
the package graph remains acyclic.
