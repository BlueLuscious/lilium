# Renderer Instruction Execution

Status: **Private execution and terminal occurrences implemented**

The execution feature interprets normalized Template declarations directly. It owns host handles
through private occurrence objects and creates no mutable virtual tree, synthetic fragment host
value, or public execution handle.

## Runtime Concepts

| Concept | Responsibility | Relationships |
| --- | --- | --- |
| `RendererInstructionExecutor<Parent, Value>` | Execute root Templates or templated Components inside one Core batch. | Uses `RendererSession`, Core integration, Component integration, and semantic owners. |
| `RendererPrimitiveOccurrence<Parent, Value>` | Own one stable host value, capability, attachment metadata, and idempotent detach/release state. | Registers cleanup immediately after creation so partial construction can roll back. |
| `RendererFragmentOccurrence<Parent, Value>` | Own ordered placeable roots without creating a host wrapper. | May contain primitives, Components, projections, fallbacks, or empty occurrences. |
| `RendererTemplateOccurrence<State, Parent, Value>` | Retain exact state, roots, direct bindings, local indexes, and terminal cleanup authority. | Cancels bindings, disposes Components, detaches primitives, then releases primitives. |
| `RendererComponentOccurrence<Parent, Value, Inputs, Controller>` | Connect a protected headless occurrence, dedicated input bindings, and its visual Template. | Cancels parent input work before visual and Component disposal. |
| `RendererSlotInputStore<Inputs>` | Own mutable Core slot signals behind one stable frozen read-only object. | Applies complete snapshots in one Core batch. |
| `RendererSlotInputSignal<T>` | Erase slot-input mutation authority at runtime. | Delegates only tracked `get()` to one private Core signal. |
| `RendererHostProtocolValidator` | Validate created object handles and undefined mutation results. | Produces `RendererProtocolError` for invalid host results. |

## Internal Contract And Type

| Contract or type | Responsibility | Relationships |
| --- | --- | --- |
| `IRendererPlaceableOccurrence<Parent, Value>` | Represent any private occurrence producing ordered host roots with terminal observation and disposal. | Implemented by primitive, fragment, Template, and Component occurrences. |
| `TRendererProjectionRequest` | Retain a genuine projection, supplying parent state, and parent attachment owner. | Selected by exact slot identity during child visual execution. |

## Execution Flow

1. Require the exact Template or templated Component object accepted by session preflight.
2. Enter one outer Core batch and the supplied semantic owner.
3. Create primitive values detached and apply static properties in declaration order.
4. Create dynamic property bindings under the active attachment owner.
5. Create nested Components through Component integration and execute visuals under attachments.
6. Select projected content or fallback at each outlet without reevaluating whole definitions.
7. Place completed child fragments and application roots through explicit sibling anchors.

Initial dynamic work evaluates synchronously before placement. Later invalidations retrack
dependencies, execute Template equality untracked, and skip equal host writes. Reentrant nested
render work drains before eligible effects through Core scheduler ordering.

## Components

Dynamic Component input declarations are one parent render binding. Initial evaluation captures
the complete snapshot used for setup; later accepted evaluations call the protected occurrence's
complete `updateInputs()` operation. Setup never reruns. The visual state combines stable read-only
component inputs and the stable public controller.

`executeComponent()` handles root compositions directly. Nested declarations use the same bridge
and are indexed by their normalized reference in the declaring Template occurrence.

## Slots And Projections

An outlet with no supplied projection executes its child-owned fallback and never evaluates slot
inputs. A supplied projection creates stable slot-input signals from the first complete snapshot,
then updates those signals in one batch through a child-owned render binding.

Projected content executes under a scope owned by the supplying parent attachment. The receiving
child attachment owns an idempotent cleanup lease for that scope. Consequently projected bindings
resolve contexts and errors through the parent while child disposal still ends the projection.

## Terminal Execution

Every primitive registers ownership cleanup immediately after successful creation. Completed
Template disposal cancels direct bindings, disposes nested Components in reverse order, detaches
all local primitives in reverse creation order, and then releases them in the same reverse order.
Partial construction relies on the same idempotent primitive cleanup through the active scope.

A failed root binding terminalizes the complete mounted application. A failed nested Component
visual terminalizes that Component and its dedicated parent input binding without disposing the
otherwise consistent parent application. Projection terminalization also cancels its slot-input
lease before releasing projected resources.

See
[instruction-driven execution](../../../architecture/renderer-protocol.md#instruction-driven-execution)
for the canonical complete flow and [Conformance](../conformance/index.md) for its observable host
trace verification.
