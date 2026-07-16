# Template Definition

The definition feature separates unnormalized declarations from reusable normalized programs.
Before `define()`, reference-bearing declarations contain `undefined`; normalized declarations
contain definition-local numeric ordinals.

| Contract or type | Responsibility | Relationships |
| --- | --- | --- |
| `TemplateDefinition<State>` | Reusable immutable normalized program identity. | Owns one normalized `TemplateFragmentType<State>`. |
| `TemplateDefinitionOptionsType<State>` | Caller-owned input accepted by `define()`. | Contains an unnormalized root fragment. |
| `TemplateFragmentType<State, Reference>` | Ordered immutable instruction sequence. | Contains `TemplateInstructionType` values sharing one state and reference phase. |
| `TemplateInstructionType<State, Reference>` | Union of node, nested component, and outlet instructions. | Connects the Primitive, Component, and Slot features. |
| `TemplateReferenceType` | Definition-local structural ordinal. | Identifies normalized instructions and bindings, never runtime or host values. |

Normalization and reference ordering follow the canonical
[immutable program](../../../architecture/template-abi.md#immutable-program) decision.

## Normalization flow

1. `define()` validates a non-array options record and root array.
2. Every root, property instruction, and child must be a genuine declaration created by the same package instance.
3. A fresh counter assigns depth-first references to each node or component and to node bindings before visiting node children.
4. Template copies and freezes every declaration container and array.
5. Primitive, property, composition, evaluator, equality, and application value references remain unchanged.

Nested component normalization copies its input declaration but does not traverse the composed
child definition. This preserves independent definition identities and keeps parent reference
allocation local to the parent program.

An active-path identity set rejects recursive declaration graphs without rejecting intentional
reuse of one declaration at multiple structural positions.
