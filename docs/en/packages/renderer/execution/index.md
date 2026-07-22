# Renderer Instruction Execution

Status: **Private static runtime implemented**

The execution feature interprets normalized primitive and fragment declarations directly. It owns
host handles through private occurrence objects and creates no mutable virtual tree, synthetic
fragment host value, or public execution handle.

## Runtime Concepts

| Concept | Responsibility | Relationships |
| --- | --- | --- |
| `RendererInstructionExecutor<Parent, Value>` | Validate the preflight identity, construct one static Template while detached, and place its roots into the session root. | Uses `RendererSession`, accepted capability lookup, and host protocol validation. |
| `RendererPrimitiveOccurrence<Parent, Value>` | Own one stable host value, its creating capability, normalized node reference, and current attachment metadata. | Commits attachment state only after successful `place()`. |
| `RendererFragmentOccurrence<Parent, Value>` | Own ordered primitive roots without creating a host wrapper. | Places every root in declaration order before one shared anchor. |
| `RendererTemplateOccurrence<State, Parent, Value>` | Retain exact state, root fragment, and primitive occurrence lookup. | Resolves normalized node references for future binding integration. |
| `RendererHostProtocolValidator` | Validate created object handles and undefined mutation results. | Produces `RendererProtocolError` for invalid `create`, `write`, or `place` results. |

## Static Flow

1. Require the exact Template object accepted by the session preflight.
2. Reject Component and outlet instructions before creating host values.
3. Resolve the already accepted primitive capability and create one detached value.
4. Apply ordered static property declarations before placing that value.
5. Construct every child root while detached and place the completed fragment beneath its parent.
6. Retain every primitive occurrence by its definition-local numeric reference.
7. Place completed Template roots into the external session root in declaration order.

Empty fragments create and place nothing. Multiple roots share no synthetic host parent. Placement
always supplies an explicit `before` anchor; `null` means the ordered end. Replacing that anchor
supports deterministic movement while preserving the same stable handles and occurrence objects.

Dynamic `TemplateBinding` declarations remain intentionally unevaluated. Nested Components,
outlets, projections, rollback, removal, release, and public mounting belong to later phases. See
[instruction-driven execution](../../../architecture/renderer-protocol.md#instruction-driven-execution)
for the canonical complete flow.
