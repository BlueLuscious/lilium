# Rendering Integration

Status: **Core and Component bridges implemented**

This document is the canonical architecture decision for the capabilities that connect Core,
Component, Template, and Renderer. It defines ownership and execution responsibilities without
defining the Template ABI or the Renderer host protocol.

## Boundary decision

Core and Component each expose a narrow adapter-facing integration subpath. These subpaths
are supported public package boundaries, but they are not part of the end-user object APIs
exported from the package roots.

- `@lilium/core/integration` binds to a genuine `ReactiveRuntime` and creates owned reactive
  render bindings. It does not expose scheduler queues, scheduler phases, dependency graph
  mutation, ownership managers, or runtime implementation classes.
- `@lilium/component/integration` creates renderer-facing component occurrences. It
  retains the complete-input update capability, exposes the regular read-only component instance,
  provides one dedicated attachment owner beneath the private component owner, and coordinates
  idempotent disposal. It does not expose the component engine, input store, mutable signals,
  component scope, or internal lifecycle object.

Importing an integration subpath grants an explicit framework-adapter capability. JavaScript
cannot prove that the caller is a renderer, so authority is communicated and constrained by the
export boundary and by the narrow objects it returns, not by a nominal caller check.

### Rejected alternatives

Adding render coordination to the root `ComponentRuntime` was rejected because it would mix
headless component usage with renderer authority and enlarge the normal application API.

Importing package-private Component or Core modules was rejected because separately published
packages cannot share private implementation paths without making those paths an accidental API.

Giving Renderer its own reactive scheduler was rejected because Core effects could then run
before host updates and batching could not provide one deterministic flush boundary.

## Capability shape

The integration contracts and runtime implementations are owned by their respective packages
without changing this authority.

The Core capability:

- is created from one existing `ReactiveRuntime` and rejects foreign implementations;
- creates identity-bearing, disposable, synchronously evaluated reactive render bindings;
- associates each binding permanently with the active owner at creation;
- delegates tracking, deduplication, cancellation, batching, error routing, and phase ordering to
  Core;
- permits Renderer to supply work but never to select a phase, flush a queue, or mutate scheduler
  state.

`CoreIntegrationApi.createRuntime(runtime)` returns a `RenderBindingRuntime`.
`RenderBindingRuntime.create(operation, terminalize)` performs synchronous initial evaluation and
returns a `RenderBinding` or `undefined` after a handled initial failure. `RenderBinding` exposes
only idempotent `dispose()`.

The Component capability:

- is created for one existing `ReactiveRuntime` independently of the root `Component` API;
- creates a headless component through the existing atomic setup semantics;
- returns no occurrence when setup failure is handled and throws when it propagates;
- returns an adapter occurrence containing a read-only `ComponentInstance`, a complete-snapshot
  input update operation, a dedicated attachment `Scope`, and idempotent disposal;
- creates the attachment scope as a child of the private component scope after setup succeeds;
- never adds input mutation or ownership attachment to the public `ComponentInstance` object.

`ComponentIntegrationApi.createRuntime(runtime)` returns a `ComponentOccurrenceRuntime`.
`ComponentOccurrenceRuntime.create(definition, options)` returns a `ComponentOccurrence` or
`undefined` after handled setup failure. The occurrence exposes `instance`, `attachment`,
`updateInputs(values)`, and `dispose()`.

Renderer owns the adapter occurrence. Application and component code may receive its read-only
instance or controller, but not its renderer-facing update authority.

## Ownership topology

The minimum topology is:

```text
ReactiveRuntime
`- Application scope
   `- Component scope                         (@lilium/component)
      |- Component setup resources            (@lilium/component)
      `- Attachment scope                     (@lilium/component/integration)
         |- Template execution resources      (@lilium/renderer)
         |- Reactive render bindings          (@lilium/core/integration)
         |- Nested rendered occurrences       (@lilium/renderer)
         `- Host resources and cleanup        (@lilium/renderer + host adapter)
```

The component scope remains private. The attachment scope is a deliberate child capability for
Renderer, not an alias of the component scope. Because it is registered after component setup,
recursive last-in-first-out disposal releases presentation resources before component setup
resources.

A root template that has no component receives an attachment scope directly beneath the
application or requesting template owner. Projected slot content retains the supplying parent
owner through the dual-lifetime projection model defined by [Template ABI](template-abi.md#projection-ownership).

Registration inside an attachment must preserve this observable disposal order:

1. Cancel reactive render bindings so no new host work can run.
2. Dispose nested rendered occurrences and template-owned resources.
3. Release or detach host resources after their bindings can no longer execute.
4. Complete attachment disposal.
5. Release component setup resources when the component scope continues disposing.

The Template and Renderer protocols will define the detailed ordering among multiple host values,
but they may not invert the attachment-before-component guarantee.

## Scheduling ownership

Core owns reactive scheduling. Renderer owns the meaning and implementation of render work.
Template owns immutable binding declarations and does not enqueue work.

The accepted synchronous order is:

1. A signal write stores its accepted value and invalidates dependent consumers.
2. A component input update writes one complete snapshot inside one Core batch.
3. Exiting the outermost batch schedules no additional boundary and begins the existing
   synchronous flush.
4. Core executes invalidated renderer bindings in FIFO render-phase order.
5. Core executes eligible user effects only after current-cycle render work.
6. Render work invalidated during an active or completed render phase runs in the next scheduler
   cycle according to Core reentry rules.

Initial structure creation and the first evaluation of each dynamic binding occur synchronously
during mount. Later invalidations use the Core integration capability. Therefore a successful
mount or input-update call returns only after its eligible host changes and effects have completed.

## Behavioral scenarios

### Create

1. Renderer receives an explicit application or parent-template owner.
2. The Component integration capability creates the component scope and runs setup exactly once.
3. A handled setup failure returns no adapter occurrence; no template or host work begins.
4. After successful setup, Component creates the attachment scope beneath the private component
   scope.
5. Renderer instantiates template and host resources with the attachment scope active.
6. Renderer exposes a rendered occurrence only after initial structure and binding evaluation
   complete successfully.

If initial template or host work does not complete, Renderer disposes every partial attachment and
the component occurrence. A handled failure returns no rendered occurrence. A propagated failure
is rethrown after cleanup, aggregating the original failure before any propagated cleanup failure.

### Update

1. Parent template evaluation produces a complete input snapshot, including `undefined` for
   cleared optional inputs.
2. Renderer sends that snapshot through the Component integration occurrence.
3. Component validates and writes every input signal in one Core batch.
4. Core deduplicates invalidated render bindings, executes them before effects, and returns control
   only after the synchronous flush completes.

Component setup never executes again. Component code continues to observe stable read-only input
signals and cannot obtain the snapshot update operation.

### Dispose

Explicit rendered-occurrence disposal and ancestor ownership disposal have the same recursive
result. Disposal is idempotent, rejects no repeated call, cancels pending render work, releases all
attachment and host resources, and then releases component setup resources. A disposed occurrence
cannot receive another input snapshot or host update.

### Handled failure

Component setup, initial template execution, render binding work, and host operations execute
under their semantic owner. Their failures traverse the nearest ownership error boundary and then
its ancestors.

A handled setup or initial-mount failure still aborts that creation attempt and exposes no partial
occurrence. A handled dynamic render failure terminalizes the complete rendered occurrence that
owns the failing binding and performs best-effort rollback or detachment before Core continues
unrelated scheduled work. See [Renderer Protocol](renderer-protocol.md#dynamic-binding-or-host-failure).

### Propagated failure

An unhandled setup or mount failure propagates synchronously after partial ownership is released.
An unhandled scheduled render failure aborts the active Core flush and clears remaining pending
jobs according to existing scheduler semantics. Renderer terminalizes the owning occurrence before
forwarding the failure so a later owner disposal remains safe and idempotent.

### Cleanup failure

Disposal attempts every registered binding, nested occurrence, template resource, host cleanup,
and component cleanup in deterministic last-in-first-out order. Each failure traverses from the
owner of the failed cleanup. Handled cleanup failures are removed; one unhandled failure is thrown
directly and multiple unhandled failures are aggregated in execution order. Ownership remains
permanently disposed even when cleanup propagates.

## Responsibility matrix

| Operation | Owner |
| --- | --- |
| Reactive dependency tracking and invalidation | Core |
| Render/effect queue ordering, batching, and flush | Core |
| Scheduled-job owner restoration and boundary traversal | Core |
| Headless setup, input storage, and component scope | Component |
| Complete parent-snapshot update authority | Component integration |
| Immutable structure, binding, and composition declarations | Template |
| Mount, rendered occurrence, binding execution, and unmount | Renderer |
| Host mutations and target-specific cleanup primitives | Host adapter |
| Host-resource lifetime and invocation order | Renderer |

## Dependency proof

The selected boundaries preserve one-way dependencies:

```text
component root             --> core root
component integration      --> core root, core integration
template                   --> core root, component root
renderer                   --> core integration, component integration, template
host adapter               --> renderer

compiler --emits imports--> component root, template
```

Core integration imports only Core implementation. Component integration may import Core public
contracts and Component implementation. Neither subpath imports Template, Renderer, Compiler, or
a host adapter. Template does not import Renderer. The graph is therefore acyclic.

## Implementation requirements

The bridge implementation establishes these prerequisites before Renderer runtime work:

1. Core provides and tests the adapter-facing render-binding capability without exporting
   scheduler or tracking internals.
2. Component provides and tests the adapter-facing occurrence capability without changing the
   root `ComponentRuntime` or public `ComponentInstance` contracts.
3. Boundary hardening verifies complete input snapshots, initial failure cleanup, scheduled
   failure routing, recursive disposal, and package exports against built distributions.

Template ABI contracts must conform to this ownership decision. Renderer must depend only on the
two integration subpaths and the accepted Template ABI.

## Implementation status

The Core bridge is implemented by the `CoreIntegration` subpath API, its runtime-bound binding
factory, an internal render-phase lifecycle, and a protected disposal-only wrapper. Terminal
settlement occurs only after active owned work unwinds.

The Component bridge is implemented by `ComponentIntegration`, a runtime-bound occurrence factory,
one post-setup attachment per occurrence, and a protected wrapper retaining complete input update
authority. Component Integration uses `CoreIntegration.assertRuntime()` only for nominal runtime
validation; root Component features remain limited to the Core root API.

Built-distribution tests prove that both integration subpaths expose only their documented API
objects and that private contract and implementation paths remain inaccessible. Cross-package
runtime tests compose Core bindings beneath Component attachments and verify complete-update
invalidation, render-before-effect scheduling, terminal settlement, recursive attachment release,
component lifecycle completion, boundary routing, and parent-owner cleanup in that order.
