# Template Slot

Slots declare static projection relationships without retaining attachment scopes or mounted host
state. Renderer later owns projection signals and the dual parent/child lifetime.

| Contract or type | Responsibility | Relationships |
| --- | --- | --- |
| `TemplateSlot<Inputs>` | Named slot identity carrying an input schema. | Referenced by outlets and projections through object identity. |
| `TemplateOutlet<State, Inputs, Reference>` | Child declaration placing one slot. | Contains complete slot-input evaluation and optional fallback. |
| `TemplateProjection<ParentState, SlotInputs>` | Parent declaration supplying content to one slot. | Retains a template over `TemplateProjectionStateType`. |
| `TemplateOutletOptionsType<State, Inputs>` | Caller input for `outlet()`. | Contains an evaluator and unnormalized fallback fragment. |
| `TemplateProjectionStateType<ParentState, SlotInputs>` | State of projected content. | Combines parent state and reactive slot inputs. |
| `TemplateSlotInputEvaluatorType<State, Inputs>` | Pure complete slot-input snapshot evaluator. | Evaluates from receiving child state. |
| `TemplateSlotInputsType<Inputs>` | Stable read-only signal map visible to projected content. | Mirrors every slot input key. |
| `TemplateSlotInputValuesType<Inputs>` | Complete immutable slot-input snapshot. | Preserves optional keys as explicit `undefined`. |

Projection ownership and fallback semantics are defined in
[Slots and projection](../../../architecture/template-abi.md#slots-and-projection).
