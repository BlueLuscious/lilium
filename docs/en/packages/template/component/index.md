# Template Component

The component feature composes visual declarations toward headless behavior without importing
Component runtime implementation or creating a live component occurrence.

| Contract or type | Responsibility | Relationships |
| --- | --- | --- |
| `TemplatedComponentDefinition<Inputs, Controller>` | Separate immutable Component and Template composition identity. | Retains both definitions and the accepted slot map. |
| `TemplateComponent<ParentState, Reference>` | Nested component instruction stored in a heterogeneous fragment. | Retains erased validated component, input, and projection declarations. |
| `ComponentTemplateStateType<Inputs, Controller>` | Frozen visual state assembled by Renderer. | Contains exact stable Component inputs and controller. |
| `TemplateComponentInputEvaluatorType<ParentState, ChildInputs>` | Pure complete child-input snapshot evaluator. | Produces `ComponentInputValuesType<ChildInputs>`. |
| `TemplateComponentOptionsType<ParentState, ChildInputs>` | Caller input for `component()`. | Combines the input evaluator with ordered projections. |

Definition independence and nested input behavior follow
[Component composition](../../../architecture/template-abi.md#component-composition).
