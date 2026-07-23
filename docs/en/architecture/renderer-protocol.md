# Renderer Protocol

Status: **First universal ABI implemented and verified by host-neutral conformance**

This document defines the universal Renderer and host protocol that executes the accepted
[Template ABI](template-abi.md). The protocol is synchronous, target-independent, instruction-
driven, and independent from platform globals.

## Design goals

The minimum protocol must:

- mount immutable Template programs without creating a mutable virtual tree;
- address host values through opaque stable handles;
- represent insertion and movement with one parent-and-anchor positioning model;
- update one primitive property or nested input binding without reevaluating complete templates;
- release every Renderer-created resource through explicit ownership;
- preserve Core render-before-effect ordering;
- provide deterministic failure and terminal cleanup semantics;
- allow browser, server, console, and native adapters without changing universal contracts.

Hydration, event delegation, streaming, transitions, portals, asynchronous rendering, and
structural control-flow algorithms are outside this minimum protocol. Host-specific packages may
add APIs around the protocol, but they cannot alter its observable ownership or scheduling rules.

## Public object model

`@lilium/renderer` follows the existing package construction pattern:

- the frozen stateless `Renderer` facade implements `RendererApi`;
- `Renderer.createRuntime(runtime, host)` creates one `RendererRuntime` bound to an existing
  `ReactiveRuntime` and reusable host adapter;
- `RendererRuntime` mounts root templates or templated components but owns neither the reactive
  runtime nor the adapter;
- each successful mount returns one `RenderedApplication` lifecycle handle;
- a component root returns a specialized `RenderedComponent` handle;
- a standalone template root returns a specialized `RenderedTemplate` handle.

The facade creates no global default runtime or host. Concrete runtime, execution, occurrence, and
registry classes remain implementation details.

### Rendered application handles

`RenderedApplication` is the common identity-bearing root lifecycle. It exposes only immutable
observations, `disposed`, and idempotent `dispose()`.

`RenderedComponent<Inputs, Controller>` additionally exposes:

- `component`, the ordinary read-only `ComponentInstance`;
- `update(inputs)`, an application-level operation accepting one complete
  `ComponentInputValuesType<Inputs>` snapshot.

The update operation delegates through the Component integration capability. It does not expose
that capability, mutable input signals, the component scope, or internal instance lifecycle.

`RenderedTemplate<State>` exposes the exact read-only state object supplied at mount. It has no
state-replacement operation. Fine-grained updates occur through signals already present in that
state rather than replacing the entire state and invalidating every binding.

Nested template, component, fallback, and projection occurrences are private Renderer objects.
They share the same terminal and disposal semantics but are never package-root exports.

## Mount boundaries

`RendererRuntime` has two explicit mount operations:

- mount a standalone `TemplateDefinition<State>` with a state object;
- mount a `TemplatedComponentDefinition<Inputs, Controller>` with complete initial inputs.

Each mount also receives:

- one external host root recognized by the configured adapter;
- an optional parent `Scope` from the same reactive runtime.

Renderer creates one application scope beneath the supplied owner or as a root runtime scope when
no owner is supplied. Exactly one active host session may claim a root. A second claim fails before
component setup or host mutation. The external host root is borrowed: Renderer never destroys or
releases it.

A handled initial failure returns `undefined`, matching Component creation. An unhandled failure
throws synchronously. No partial rendered application handle can escape.

## Host adapter and session

A `RendererHost<Root, Parent, Value extends Parent>` is a reusable third-party extension object. It opens one
exclusive `RendererHostSession<Parent, Value>` for an external root. The session wraps the target
root in an opaque parent handle and owns any root reservation or per-application adapter state.

`Parent` and `Value` are opaque object handles. Renderer compares them only by object identity and
never reads platform state from them. Every created value has one stable handle until release.
Adapters may wrap platform values internally, but those platform types do not appear in universal
contracts. Every value is structurally accepted as a potential parent; the resolved primitive
capability determines whether child placement is actually supported.

The session provides:

- its opaque root-parent handle;
- primitive-capability resolution;
- atomic placement of a detached or attached value;
- atomic removal of an attached value;
- synchronous idempotent session close after all values are released.

The session is registered as the first application cleanup. Because ownership disposal is
last-in-first-out, rendered occurrences release all host values before the host session closes.

Opening or closing a session must return synchronously. Promise-like host operations are invalid.

## Primitive capabilities

For each supported `TemplatePrimitive`, a session resolves one immutable primitive capability. A
capability:

- identifies the exact primitive object it implements;
- declares whether values of that primitive may accept children;
- creates one detached opaque host-value handle;
- resolves the exact `TemplateProperty` objects it supports;
- writes one static or dynamic property value;
- permanently releases one detached host-value handle.

Property support is based on capability-object identity, never a diagnostic string. Renderer
preflights every reachable primitive, property, and parent-child requirement before component
setup. Missing primitive support, missing property support, and children beneath a non-parent
primitive are deterministic compatibility failures.

Requirement collection follows the normalized reachable branch for each component occurrence. A
provided projection replaces its matching outlet fallback during collection; the fallback is
visited only when that projection is absent. Primitive and property requirements are deduplicated
by exact object identity in first-reachable-declaration order. Capability resolution may execute
during preflight, but creation, property writing, placement, removal, and release cannot.

The host does not receive a complete `TemplateDefinition`, binding evaluator, component
definition, slot, or ownership object. It receives only resolved primitive operations, candidate
property values, and structural placement commands.

Property adapters own target-specific replacement cleanup. For example, replacing a callback-
valued property must release any listener or subscription represented by the previous committed
value before the adapter reports success. Renderer still owns the binding and primitive lifetime.

## Host operations

The minimum structural operations are `place` and `remove`.

### Place

Conceptually, `place(parent, value, before)` makes `value` an immediate child of `parent` directly
before the supplied sibling. `before: null` means the end of the parent's ordered children.

The same operation covers both insertion and movement:

- a detached value becomes attached;
- an attached value moves within its current parent;
- an attached value moves from another parent into the destination parent.

Renderer supplies the current and destination placement metadata it already owns. The session does
not expose parent lookup, sibling lookup, child collections, indexes, or a host-tree snapshot.

The anchor must be `null` or an attached immediate child of the destination parent distinct from
the moved value. Renderer validates its own metadata; the adapter validates target-specific
constraints.

### Remove

Conceptually, `remove(parent, value)` detaches one immediate child without releasing its handle.
Removal is required before permanent release. A detached value can be placed again until release.

### Release

Primitive capability `release(value)` permanently releases a detached value and any remaining
target-specific resources. Renderer removes the handle from all occurrence tables before invoking
release and never uses it again, including when release throws.

Separating remove from release permits movement, failure rollback, detached subtree construction,
and deterministic target cleanup without requiring host-tree inspection.

## Atomic host contract

Every host operation is synchronous and operation-level atomic:

- failed session opening leaves no claimed root;
- failed primitive creation returns no handle and leaves no adapter-owned partial value;
- failed property writing preserves the previously committed host property;
- failed placement preserves the previous detached or attached position;
- failed removal preserves the previous attachment;
- failed session close leaves the session terminal and unusable;
- release is terminal from Renderer's perspective even if target cleanup reports a failure.

Operations return `undefined` on success. Renderer treats any other return value or Promise-like
result as a protocol violation. The adapter may throw any error object; Renderer does not require a
closed host-error class hierarchy.

Operation-level atomicity does not make a complete mount transactional. Renderer explicitly
unwinds all earlier successful operations when a later operation fails.

## Instruction-driven execution

Renderer interprets normalized Template declarations directly. Reconciliation is not delegated to
the host, and Renderer does not compare old and new definition trees.

During initial instantiation Renderer:

1. Preflights the complete reachable declaration graph against the host session.
2. Creates component and attachment ownership through the approved integration capability.
3. Creates primitive values detached from the external root.
4. Applies static properties and initial dynamic binding values.
5. Builds child relationships with `place()` while parent values remain detached where possible.
6. Creates nested rendered components, projections, or fallbacks in declaration order.
7. Places the completed root values into the external root in declaration order.
8. Publishes the rendered application only after all root values are attached successfully.

The implemented executor accepts the exact Template or templated Component identity retained by
session preflight, creates each primitive while detached, applies `TemplateStaticValue`
declarations, creates Core render bindings for dynamic values, constructs child fragments, and
then places children and roots in declaration order. Template equality executes through Core's
untracked integration authority and suppresses equal host writes.

Nested and root Components are created only through Component integration. Their visual Template
work executes under the dedicated attachment scope, while complete dynamic input snapshots flow
through one parent render binding. Outlets choose the supplied projection or child-owned fallback.
Projected content owns a parent attachment child scope plus an idempotent receiving-child lease,
and slot-input snapshots update stable private Core signals in one batch.

Each private primitive occurrence owns one stable handle, its creating capability, and its current
attachment metadata. Fragment occurrences own ordered primitive roots without synthetic host
wrappers. A Template occurrence retains the application state and a definition-local
reference-to-occurrence maps for primitive and Component lookup. Fragment roots may be primitives,
nested Components, projected Templates, or fallbacks through one private placeable contract. None
of these objects is exported from the package root.

Fragments, templates, components, and slots do not require synthetic host wrapper values. A
rendered occurrence owns an ordered set of top-level host handles that can be placed into its
requesting parent. Empty static fragments own no position. Future dynamic empty regions require a
separately approved anchor capability rather than hidden platform markers.

Dynamic property updates execute one resolved property write. Component-input and slot-input
bindings forward one complete snapshot through their respective stores. Future structural
instructions will compute explicit `place()` and `remove()` commands; they must not introduce a
whole-template diff.

## Initial scheduling

Renderer executes each complete mount inside one outer `ReactiveRuntime.batch()` boundary.
Component setup still runs exactly once, but setup-created effects remain queued until initial
template bindings and host placement finish.

Initial binding evaluators run synchronously while their host values are detached. They commit
through the Core integration capability so later invalidations retain the same binding identity
and semantic owner.

On successful outer-batch exit:

1. Every initial host value is already attached.
2. Eligible render work runs first if setup or later mount work invalidated an established binding.
3. User effects run after the current render phase and observe the mounted host state.
4. Mount returns only after the synchronous flush completes.

If mount fails, Renderer terminalizes and disposes partial ownership before leaving the batch. This
cancels setup effects and render bindings before Core performs final batch bookkeeping.

## Dynamic scheduling

Core owns tracking, deduplication, phase selection, reentry, flushing, and owner restoration.
Renderer supplies only the binding evaluator and committed host operation through
`@lilium/core/integration`.

An accepted signal write invalidates dependent render bindings synchronously. Outside batching,
the Core flush remains synchronous. Inside batching, all candidate values are immediately readable
but host operations wait for the outer boundary. Current-cycle render work completes before user
effects; reentrant render work follows Core's next-cycle rules.

Renderer cannot manually enqueue a job, select a scheduler phase, or force a flush.

## Ownership and disposal

Renderer applies the accepted [ownership topology](rendering-integration.md#ownership-topology).
The application scope owns its host session and root occurrences. Component attachments own their
template bindings, nested rendered occurrences, and host handles. Parent template attachments own
projected content through the accepted slot lease.

`RenderedApplication.dispose()` executes inside one Core batch so cleanup-triggered reactive writes
cannot run effects against a partially removed host tree.

Normal occurrence disposal is idempotent and performs these stages:

1. Mark the occurrence disposing and reject new updates.
2. Cancel all pending and connected render bindings.
3. Dispose projected content and nested rendered occurrences in reverse ownership order.
4. Remove primitive values in reverse creation order, from descendants toward roots.
5. Release every detached primitive value in reverse creation order.
6. Complete attachment and component ownership disposal.
7. Close the host session after every application occurrence has completed cleanup.

Every registered cleanup is attempted even after a failure. Handles become terminal before their
release operation, so later disposal paths remain idempotent.

Ancestor scope disposal follows the same path and updates the public `disposed` observation. A
disposed or terminal `RenderedComponent` rejects later `update()` calls.

## Failure and terminal behavior

### Preflight failure

Definition-shape errors occur before mount through Template APIs. Host-session opening and
compatibility preflight run with the application scope as semantic owner but before Component setup
or host mutation. A handled opening or preflight failure closes any opened session and returns
`undefined`; a propagated failure closes the session when present and throws.

The implemented private session wrapper becomes permanently terminal before invoking host
`close()`, releases its process-local host-and-root claim even when closing fails, and rejects all
later preflight or host access. If preflight and close both fail, it throws an `AggregateError` with
the compatibility or protocol failure first.

### Initial mount failure

Renderer marks the partial root occurrence terminal, cancels bindings, disposes nested ownership,
removes every successfully attached value, releases every successfully created value, and closes
the host session. Cleanup continues after individual failures.

A handled failure exposes no rendered application. One propagated failure is thrown directly;
multiple propagated failures form an `AggregateError` with the original mount failure first and
cleanup failures in execution order.

### Dynamic binding or host failure

A dynamic evaluator, equality, property write, component-input update, or slot-input update
failure terminalizes the complete rendered occurrence that owns the binding. Terminalizing only
the failed binding was rejected because sibling bindings could continue writing into an
inconsistent or detached host subtree.

Terminalization prevents new updates, cancels every occurrence binding, disposes nested
occurrences, and removes and releases its host values before the failure is reported. The Core
integration bridge must complete any owner finalization that cannot occur while its own scheduled
callback is active. This finalization is internal and cannot expose scheduler or ownership
mutation.

Projected-content failure terminalizes the projection occurrence and traverses the supplying
parent's error boundaries. Fallback failure terminalizes the fallback occurrence and traverses the
receiving child's boundaries. A nested component failure terminalizes that rendered component,
not its parent occurrence. An unhandled error may abort the shared flush, but it does not silently
dispose otherwise consistent ancestor occurrences.

If the nearest boundary handles the final error, Core continues unrelated scheduler work. If the
error propagates, Core aborts the active flush and clears remaining pending jobs. In both cases the
failed occurrence is already terminal and cannot execute again.

### Cleanup failure

Cleanup errors never restore a terminal occurrence or handle. Renderer attempts all remaining
cleanup, routes each failure from its semantic owner, and aggregates only failures that remain
unhandled. A target resource that could not be released is an adapter failure, not a reusable
Renderer handle.

## Host-neutral scenarios

### Mount

Given a group primitive containing a value primitive, conformance observes capability preflight,
detached creation, static and initial dynamic writes, child placement into the group, and final
group placement into the session root. No user effect runs before final root placement.

### Update

Changing one signal read only by the value property's binding produces at most one property write
for that binding. An equal derived candidate produces no host operation. No primitive is recreated
and no unrelated binding reevaluates.

### Reorder

Given three already attached opaque values, placing the third before the first changes their host
order without creating, removing, or releasing any handle. This validates movement semantics even
though the minimum Template ABI does not yet expose a structural repetition instruction.

### Unmount

Unmount cancels bindings, detaches application roots, detaches descendant relationships, releases
all values in reverse creation order, and closes the session. Repeating unmount produces no host
operation.

### Failure

Conformance injects failure independently into create, property write, place, remove, release, and
session close. It verifies operation-level atomicity, best-effort cleanup, error ordering,
terminal handles, and absence of later binding execution.

## Console conformance adapter

The private Console adapter implements the universal protocol without special Renderer branches. Its
minimum conformance surface contains:

- opaque root and value handles with deterministic diagnostic identifiers;
- group and value primitive capabilities with object-identity property registration;
- one ordered child list per parent strictly inside the adapter;
- structured attempted/completed traces for every host operation with normalized logical identities;
- configurable failure injection for every host operation;
- assertions that reject invalid anchors, released handles, duplicate release, and unsupported
  capabilities.

Tests use the trace to verify exact mount, update, movement, failure, and unmount sequences.
`@lilium/renderer-console` is private conformance infrastructure for the first milestone; its
protocol obligations are fixed here, while publication would require a later explicit API decision.

The package-level [conformance suite](../packages/renderer/conformance/index.md) proves the
universal protocol with an internal recording host. The private
[Renderer Console adapter](../packages/renderer-console/index.md) implements the external host
lifecycle solely through public Renderer contracts. It now records deterministic structured
traces, omits exact capabilities, and injects every host-operation failure without Renderer
implementation imports. Shared scenario execution completes in its following phase.

## Browser adapter proof

A browser adapter can wrap an external mount container and every created platform node in opaque
protocol handles. Primitive capabilities create the underlying target value, property capabilities
apply attributes, properties, textual values, or listener replacement, and session `place()` maps
both insertion and movement to the target's before-anchor insertion operation. `remove()` detaches
the value, while `release()` removes retained listener and adapter state.

All browser-specific types and operations remain inside that adapter. Renderer sees only opaque
objects, capability identities, candidate values, parent handles, and sibling anchors. Therefore a
browser renderer needs no change to the universal protocol.

## Minimum concept families

When implementation epics are created, one principal concept per file remains mandatory:

- `api`: `RendererApi` and the frozen `Renderer` facade;
- `runtime`: `RendererRuntime` and integration composition;
- `host`: host adapter, host session, primitive capability, property capability, opaque parent and
  value types, and protocol errors;
- `application`: rendered application, rendered template, and rendered component contracts;
- `execution`: normalized declaration traversal, occurrence state, bindings, placement metadata,
  terminalization, and cleanup;
- `conformance`: shared host-neutral scenarios, kept outside production runtime exports.

Host-specific packages own concrete adapters and primitive mappings. Universal Renderer owns no
browser, server, console, or native implementation.

## Dependency proof

Renderer depends on Core integration, Component integration, and Template. Host adapters implement
Renderer contracts and therefore depend toward Renderer. Renderer never imports a host adapter.

```text
core integration ---------\
component integration -----+--> renderer <-- host adapter
template -----------------/
```

No dependency points from Core, Component, or Template toward Renderer, and no host implementation
points back into those lower-level packages. The graph remains acyclic.
