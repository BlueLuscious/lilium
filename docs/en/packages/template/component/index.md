# Template Component

The component feature composes visual declarations toward headless behavior without importing
Component runtime implementation or creating a live component occurrence.

| Contract or type | Responsibility | Relationships |
| --- | --- | --- |
| `TemplatedComponentDefinition<Inputs, Controller>` | Separate immutable Component and Template composition identity. | Retains both definitions and the accepted slot map. |
| `TemplateComponent<ParentState, Reference>` | Nested component instruction stored in a heterogeneous fragment. | Retains erased validated component, input, and projection declarations. |
| `TemplateComponentInputValue<Inputs>` | Static complete-input declaration. | Owns a copied frozen `ComponentInputValuesType<Inputs>` container while retaining application values by reference. |
| `TemplateComponentInputBinding<ParentState, ChildInputs>` | Dynamic complete-input declaration. | Retains one unevaluated `TemplateComponentInputEvaluatorType`. |
| `ComponentTemplateStateType<Inputs, Controller>` | Frozen visual state assembled by Renderer. | Contains exact stable Component inputs and controller. |
| `TemplateComponentInputType<ParentState, ChildInputs>` | Discriminated static-or-dynamic input declaration union. | Connects nested component instructions to their value or binding form. |
| `TemplateComponentInputEvaluatorType<ParentState, ChildInputs>` | Pure complete child-input snapshot evaluator. | Produces `ComponentInputValuesType<ChildInputs>`. |
| `TemplateComponentOptionsType<ParentState, ChildInputs>` | Caller input for `component()`. | Accepts complete static or dynamic inputs plus ordered validated projections. |

## Declaration flow

1. `compose()` verifies an immutable public Component definition and a genuine normalized Template definition.
2. It creates a separate frozen nominal composition without modifying either supplied definition.
3. `component()` verifies that composition, captures complete inputs, and copies projections targeting exact accepted slot identities.
4. `define()` copies the nested declaration and projections, assigns its definition-local reference, and preserves every independent identity.
5. Normalization does not enter the child visual definition; each definition remains independently reusable.

Template creates no Component instance, scope, lifecycle, reactive consumer, or Renderer state.
Projection declaration and validation are documented by the [Slot feature](../slot/index.md).

Definition independence and nested input behavior follow
[Component composition](../../../architecture/template-abi.md#component-composition).
