# DOM Renderer Boundary

Status: **Accepted for Epic 009 implementation**

This document defines the canonical boundary for the planned `@lilium/renderer-dom` package. It
specializes the target-independent [Renderer Protocol](renderer-protocol.md) for browser DOM
execution without moving browser concepts into Core, Component, Template, or universal Renderer.

The package is a configurable DOM host adapter. It does not own application behavior, semantic UI
primitive identities, templates, component definitions, or a browser application facade.

## Design goals

The first DOM boundary must:

- implement Renderer host sessions through browser DOM operations;
- preserve exact `TemplatePrimitive` and `TemplateProperty` object identity;
- keep semantic UI declarations independent from HTML, SVG, and browser events;
- create platform nodes detached before placement;
- represent platform nodes through private opaque handles;
- apply text, attributes, DOM properties, and callbacks through explicit mappings;
- restore Core ownership and error semantics for later browser callbacks;
- release listener and handle state deterministically during terminal cleanup;
- verify target-independent logic through the existing Node pipeline and DOM behavior in real
  browser engines.

The first boundary does not include SSR, hydration, streaming, static generation, CSS processing,
transitions, portals, generalized event delegation, a router, PWA behavior, or a browser facade.

## Responsibility boundary

| Layer | Responsibility |
| --- | --- |
| Core | Reactivity, batching, ownership, error boundaries, and guarded later execution. |
| Component | Headless setup, inputs, controller behavior, and component ownership. |
| Template | Portable primitive and property identities plus immutable visual declarations. |
| Renderer | Target-independent preflight, execution, occurrence ownership, and terminalization. |
| Renderer DOM | DOM node creation, explicit mappings, placement, property application, listeners, and root claims. |
| UI library | Semantic primitives, headless components, default templates, and optional target mappings. |

No Lilium package imports an external UI library. A target adapter depends toward universal
Renderer, and an external UI-library adapter depends toward the Lilium packages it integrates.
The complete external-library model is defined by
[External UI Library Integration](external-ui-library-integration.md).

## Primitive implementation model

`@lilium/renderer-dom` does not publish semantic primitives such as `Button`, `Label`, `Stack`, or
`Action`. Those identities belong to a UI library or application and remain target-independent.

Renderer DOM instead creates nominal implementation declarations for exact existing identities.
Its public object API is expected to provide implementation families conceptually equivalent to:

- `RendererDom.text(primitive, options)`;
- `RendererDom.element(primitive, options)`;
- `RendererDom.attribute(property, options)`;
- `RendererDom.booleanAttribute(property, options)`;
- `RendererDom.property(property, options)`;
- `RendererDom.event(property, options)`;
- `RendererDom.createHost(options)`.

The final signatures belong to Epic 009 contracts, but their authority is fixed here:

- implementation lookup uses exact primitive and property object identity;
- diagnostic names never participate in lookup;
- declarations are created and registered nominally by Renderer DOM;
- one host receives a complete explicit unique implementation list;
- duplicate primitive or property implementations are rejected;
- unsupported capabilities fail during Renderer preflight before Component setup or DOM mutation;
- importing an implementation declaration never mutates a global default host.

An application may combine declarations from a UI-library DOM adapter and its own declarations
when creating one host. Duplicate identities never imply an override.

## DOM roots

The first public root type is conceptually:

```ts
type DomRootType = Element | DocumentFragment;
```

This accepts HTML and SVG elements, ordinary document fragments, and `ShadowRoot`. `Document` is
excluded because its structural insertion rules do not represent an ordinary application mount
container.

Renderer DOM borrows the root. It never destroys, releases, or clears it. Existing children remain
in place, and application roots are inserted at the ordered end. Unmount removes only nodes owned
by that rendered application.

One loaded Renderer DOM package instance owns a process-local weak root-claim registry keyed by the
actual container identity. This prevents separate `DomHost` objects from concurrently claiming the
same container. Closing a session releases its claim even when another cleanup operation fails.

Every session derives node creation from the active root's `ownerDocument`. One reusable host can
therefore open independent roots from different documents without capturing a global `document`.

## Opaque handles

Renderer never receives a browser `Node`. Renderer DOM wraps roots and values in private stable
handles carrying session-local records.

A record retains only the state needed for protocol validation and cleanup:

- the private platform node;
- the creating session and primitive implementation;
- root, text, or element role;
- detached, attached, or released lifecycle;
- current immediate parent handle;
- registered callback-property state;
- terminal cleanup state.

Text and element implementations create value handles. A root receives a parent-only handle.
Every value is created detached and remains stable until permanent release.

Template fragments do not create synthetic DOM values. Renderer already represents one fragment
as an ordered sequence of placeable roots. A `DocumentFragment` is valid as an external root but
not as a rendered value primitive because inserting it consumes its children and does not preserve
a stable attached identity.

Future dynamic empty regions or structural ranges require an explicitly accepted anchor or range
capability. They cannot be represented by an undocumented fragment wrapper.

## Placement and movement

DOM placement maps Renderer destination metadata to the platform's before-anchor operation:

```ts
parent.insertBefore(node, before);
```

`before: null` means the ordered end. The same operation inserts a detached node, moves an attached
node within one parent, or moves it between parents.

Before mutation, the adapter validates:

- that the session remains open;
- that every handle belongs to that session;
- that the value is live and unreleased;
- that the destination accepts children;
- that the supplied current attachment agrees with adapter state;
- that a non-null anchor is an immediate destination child;
- that the value is not its own anchor;
- that placement cannot create a node cycle.

Adapter attachment state commits only after `insertBefore()` succeeds. A failed operation leaves
that state unchanged.

Removal validates the exact current parent and uses `removeChild()`. It detaches without releasing
the handle. Release requires a detached live value, marks it terminal before target cleanup, removes
remaining listener state, drops retained references, and is never followed by another operation on
that handle.

Session close is idempotent. It becomes terminal before releasing the root claim and retained
session state.

## Operation atomicity

Renderer DOM guarantees operation-level consistency for its own records. Validation completes
before mutation, and adapter metadata commits only after the corresponding DOM operation succeeds.

This is not a transaction over arbitrary browser side effects. A custom-element constructor,
custom property setter, or platform callback can produce external effects before throwing.
Renderer DOM does not claim to roll those effects back. Renderer still terminalizes partial
application work and attempts every applicable cleanup according to the universal protocol.

## Element and property mappings

Every element implementation declares its local name and namespace explicitly. HTML and SVG do not
depend on diagnostic primitive names or capitalization heuristics.

The first mapping families have these semantics:

| Mapping | Accepted commit behavior |
| --- | --- |
| Text content | Assign the candidate to the private `Text.data`. |
| Attribute | Use explicit namespace and name; remove for `null` or `undefined`; otherwise stringify. |
| Boolean attribute | Set an empty value for `true`; remove for `false`, `null`, or `undefined`. |
| DOM property | Assign the exact candidate to one explicitly configured property key. |
| Event | Install one owned wrapper, replace its retained callback, and remove it for `null` or `undefined`. |

Renderer remains responsible for binding equality and redundant-write suppression. Renderer DOM
does not add a second generic equality layer.

Arbitrary strings do not decide whether a value is an attribute, boolean attribute, DOM property,
text value, or callback. The mapping declaration selects that behavior explicitly.

Namespaced attributes retain both namespace and qualified name. SVG element creation uses the SVG
namespace, while HTML element creation uses the HTML namespace. The first tests cover null removal,
boolean presence, namespace behavior, and equal-value suppression through Renderer.

## Owned callback execution

Initial and dynamic property writes already execute under Renderer-owned Core work. A browser
listener runs later, after that write has returned, so invoking a callback directly would lose:

- the semantic owner;
- nearest error boundaries;
- event-level batching;
- untracked callback execution;
- deterministic occurrence terminalization after failure.

The DOM adapter cannot import Core integration or receive a mutable `Scope`. Universal Renderer
will expose a narrow host-facing execution capability:

```ts
interface RendererHostExecution {
    run(operation: () => void): void;
}
```

The accepted host-property write boundary becomes conceptually:

```ts
write(
    value: Value,
    candidate: PropertyValue,
    execution: RendererHostExecution,
): void;
```

Ordinary property implementations ignore the execution capability. Callback implementations
retain it only inside their listener state. Renderer owns and revokes the concrete execution
object; hosts cannot dispose or retarget it.

Core integration requires one additional narrow owned-execution capability. Renderer uses it to
capture the occurrence owner and terminalizer without exposing either to the host. A later
`RendererHostExecution.run()`:

1. ignores invocation after revocation;
2. validates synchronous operation shape;
3. runs untracked beneath the captured owner;
4. opens a Core batch around the callback;
5. owns callback-created resources beneath that owner;
6. defers failure settlement until owned execution unwinds;
7. terminalizes the exact owning occurrence;
8. routes the original and cleanup failures through the original owner boundaries.

A handled callback failure still terminalizes the occurrence, matching dynamic binding and host
write failures. Handling acknowledges the failure; it does not reconstruct a consistent released
subtree. Root callbacks terminalize the root application. Nested component, projection, and
fallback callbacks use the terminalizer already associated with their occurrence.

The Core integration capability remains generic owned execution rather than a DOM-event API.
Renderer wraps it as `RendererHostExecution`, and Renderer DOM sees no Core contract.

## Listener lifecycle

One event-property occurrence owns one stable platform listener wrapper. The wrapper reads the
latest retained candidate when invoked.

The first listener rules are:

- the first non-null write installs one wrapper;
- a later non-null write replaces the retained callback without stacking listeners;
- `null` or `undefined` removes the wrapper and callback reference;
- event type and capture behavior are immutable declaration metadata;
- permanent value release removes every remaining wrapper;
- revoked execution turns an already-delivered stale invocation into a no-op;
- `once` is deferred because the browser would mutate listener state independently;
- generalized delegation is deferred until repeated behavior justifies a separate service.

The callback property value may use a portable UI-library event type. A target adapter maps the
browser `Event` into that portable type before invoking the candidate. DOM event classes do not
enter a target-independent UI-library package merely because its DOM adapter exists.

## Direct client composition

Renderer DOM creates implementations and hosts. It does not mount applications itself.

The accepted composition remains:

```ts
const host = RendererDom.createHost({
    primitives: [...libraryDomImplementations, ...applicationDomImplementations],
});
const renderer = Renderer.createRuntime(runtime, host);
const application = renderer.mountComponent(definition, { root, inputs });
```

No `RendererDom.mount()` or package-global default host is approved. A future browser facade must
own proven composition behavior beyond re-exporting these operations.

## Verification strategy

The first package does not depend on an emulated DOM. The existing Node test pipeline verifies
contracts, declaration identity, registries, validation, preflight, owned callback execution,
listener-state transitions, cleanup planning, public types, generated declarations, and package
exports wherever those responsibilities do not require browser behavior. Narrow test doubles may
represent Lilium-owned boundaries, but the repository does not build a general DOM simulation.

DOM semantics are verified only in native browser engines. Renderer DOM owns a runner-neutral
scenario harness containing setup, operations, assertions, and expected diagnostics. A replaceable
Playwright adapter transports that harness into browsers; Playwright APIs do not become part of
production code, public contracts, or the scenario model.

Browser conformance begins with Chromium to establish the harness and then expands to Firefox and
WebKit before Epic 009 is complete. It executes the built ESM packages through an explicit browser
entry without introducing a production bundler dependency. The suite covers shared Renderer
scenarios, package import behavior, HTML, SVG, Shadow DOM, listener failures, and terminal cleanup.

Playwright and browser binaries are development infrastructure introduced only when native
conformance begins. They are pinned, installed explicitly in CI, and isolated so another browser
automation adapter can replace them without rewriting Lilium's scenarios. Once Renderer DOM enters
the required repository surface, complete verification includes both the existing Node pipeline
and the native-browser job.

## Package and compiler boundaries

Production `@lilium/renderer-dom` depends only on the public `@lilium/renderer` package. Primitive
and property types can be derived from Renderer host contracts, as the Console adapter already
demonstrates. Core and Template are development dependencies only where integration tests need
them.

Production TypeScript uses ES2022 plus DOM libraries and no ambient type packages. Architecture
tooling permits DOM types only in this package and continues rejecting them in Core, Component,
Template, Renderer, Compiler, and Renderer Console.

The first `.lily` compiler milestone does not add callback syntax. Programmatic Template
definitions can use callback-valued properties immediately. Future compiler event syntax must emit
the same public Template values and cannot select a DOM implementation.

## Deferred work

- Server rendering, serialization, hydration, and streaming.
- Dynamic structural anchors and range movement.
- Portals and cross-root placement.
- Event delegation and listener-option expansion.
- CSS processing, style scoping, and transitions.
- Custom-element lifecycle guarantees beyond platform operation consistency.
- A browser application facade.
