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
