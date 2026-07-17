# Template Slot

Slots declare static projection relationships without retaining attachment scopes or mounted host
state. Renderer later owns projection signals and the dual parent/child lifetime.

| Contract or type | Responsibility | Relationships |
| --- | --- | --- |
| `TemplateSlot<Inputs>` | Named slot identity carrying an input schema. | Referenced by outlets and projections through object identity. |
| `TemplateOutlet<State, Inputs, Reference>` | Child declaration placing one slot. | Contains complete slot-input evaluation and optional fallback. |
| `TemplateProjection<ParentState, SlotInputs>` | Nominal parent declaration supplying content to one slot. | Created by `projection()` and retains a template over the matching `TemplateProjectionStateType`. |
| `TemplateOutletOptionsType<State, Inputs>` | Caller input for `outlet()`. | Contains an evaluator and unnormalized fallback fragment. |
| `TemplateProjectionStateType<ParentState, SlotInputs>` | State of projected content. | Combines parent state and reactive slot inputs. |
| `TemplateSlotInputEvaluatorType<State, Inputs>` | Pure complete slot-input snapshot evaluator. | Evaluates from receiving child state. |
| `TemplateSlotInputsType<Inputs>` | Stable read-only signal map visible to projected content. | Mirrors every slot input key. |
| `TemplateSlotInputValuesType<Inputs>` | Complete immutable slot-input snapshot. | Preserves optional keys as explicit `undefined`. |

## Declaration flow

1. `slot()` creates a new frozen nominal identity; omission selects the normalized name `"default"`.
2. `outlet()` validates that identity, retains one unevaluated input function, and copies its optional fallback fragment.
3. `define()` assigns the outlet reference before recursively normalizing fallback declarations.
4. Definition normalization rejects repeated slot identities and distinct identities sharing one name.
5. `compose()` exposes the exact accepted identities through a frozen name-to-slot map.
6. `projection()` creates a genuine declaration and preserves the slot-input-to-state type relationship.
7. `component()` copies projections in caller order and retains each projected Template definition independently.

Projection omission is valid. Renderer later instantiates the child-owned fallback when present or
leaves the outlet empty. A supplied projection must use the exact accepted slot object; another
identity with the same name is unknown. Structurally fabricated projection records and repeated
accepted slots are errors.

Template never evaluates outlet inputs, enters projected definitions, or creates slot signals.
Those execution responsibilities belong to Renderer.

Projection ownership and fallback semantics are defined in
[Slots and projection](../../../architecture/template-abi.md#slots-and-projection).
