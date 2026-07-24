# External UI Library Integration

Status: **Accepted reference boundary**

This document defines how an external UI library can compose with Lilium while preserving
framework independence, target independence, and one-way package dependencies. Lotus is the
reference example because it is planned as an independent headless and visual UI library, but
Lilium does not depend on Lotus or reserve package names for it.

The applicable Lilium foundations are [Package Boundaries](package-boundaries.md),
[Template ABI](template-abi.md), and [DOM Renderer Boundary](dom-renderer-boundary.md).

## Three levels of portability

The word portable has three distinct meanings:

| Layer | Framework relationship | Target relationship |
| --- | --- | --- |
| External headless core | Framework-independent. | Target-independent. |
| Lilium adapter | Lilium-specific. | Target-independent. |
| Lilium target adapter | Lilium-specific. | Target-specific. |

For Lotus, the conceptual package split is:

| Package | Responsibility |
| --- | --- |
| `@lotus/core` or `@lotus/headless` | Framework-neutral state, actions, policies, and portable event contracts. |
| `@lotus/lilium` | Lilium `ComponentDefinition` values, primitive identities, default templates, and ready compositions. |
| `@lotus/lilium-dom` | DOM implementations for the exact identities exported by `@lotus/lilium`. |

The first package name remains a Lotus repository decision. The responsibilities and dependency
direction are the stable part of this reference.

## Dependency direction

The reference graph is:

```text
@lotus/core
    ^
    |
@lotus/lilium --------> @lilium/component
    |                  \> @lilium/template
    ^
    |
@lotus/lilium-dom ----> @lilium/renderer-dom
```

No dependency points from a Lilium package into Lotus:

```text
Lilium packages -X-> Lotus packages
```

An application may import both package families, but application composition does not reverse the
library dependency graph.

## Lotus toward Lilium

The framework-neutral Lotus layer owns behavior that can survive any adapter:

- component state and state transitions;
- semantic commands such as `open`, `close`, `toggle`, or `press`;
- portable callback and event contracts;
- validation and coordination policies;
- optional service contracts such as persistence.

It contains no `ReactiveRuntime`, `ComponentDefinition`, `TemplateDefinition`, `HTMLElement`,
`localStorage`, host handle, Renderer capability, or framework lifecycle.

`@lotus/lilium` adapts that domain into Lilium. It may export, per feature:

- one headless Lilium `ComponentDefinition`;
- one or more compatible `TemplateDefinition` values;
- semantic `TemplatePrimitive` and `TemplateProperty` identities;
- one ready `TemplatedComponentDefinition` composed from the default behavior and template.

This package may depend on Lilium Component and Template because it intentionally targets Lilium.
It does not depend on Renderer DOM, browser globals, or another target adapter.

`@lotus/lilium-dom` maps the exact identities from `@lotus/lilium` to Renderer DOM text, element,
attribute, property, and event implementations. It contains browser names, namespaces, event
translation, and listener choices. It does not redefine Lotus behavior or templates.

## Lilium applications consuming Lotus

A Lilium application can consume Lotus at several independent levels.

### Headless behavior with an application template

The application imports the headless Lilium component and supplies its own compatible template:

```ts
const ApplicationSidebar = Template.compose(
    LotusSidebarComponent,
    ApplicationSidebarTemplate,
);
```

No Lotus default visual definition or DOM mapping is required.

### Default template with application target mappings

The application imports the Lotus template or ready composition but supplies compatible
implementations for every primitive identity itself. This supports custom DOM policy, testing
hosts, server targets, or a future native target without changing the Lotus template.

### Default template and default DOM mappings

The application combines Lotus DOM implementations with its own host declarations:

```ts
const host = RendererDom.createHost({
    primitives: [
        ...LotusDom.primitives,
        ...ApplicationDom.primitives,
    ],
});
```

Importing `@lotus/lilium-dom` does not register a global host. Duplicate primitive identities are
configuration errors rather than overrides.

### Headless Lotus outside Lilium

Another framework adapter consumes the framework-neutral Lotus layer:

```text
@lotus/react  ------\
@lotus/svelte -------+--> @lotus/core
@lotus/other  -------/
```

Lilium `TemplateDefinition` values are not executable templates for another framework. Reuse
occurs at the headless behavior, semantic event, and design-policy layers. Another framework owns
its own presentation adapter.

## Headless, template, and ready exports

The reference feature export has three independent values:

```ts
export {
    LotusSidebarComponent,
    LotusSidebarTemplate,
    LotusSidebar,
};
```

`LotusSidebarComponent` is headless within Lilium and can be composed with any compatible template.
`LotusSidebarTemplate` is visual within Lilium but target-independent. `LotusSidebar` is the ready
composition of the default component and default template.

Keeping them separate avoids optional template state on a headless definition and permits:

- behavior-only consumption;
- multiple presentations for one behavior;
- reuse of one presentation with compatible behavior definitions;
- target-specific implementation selection at host creation;
- independent testing of behavior, declarations, and platform mappings.

The first Lotus Lilium adapter does not need separate packages for component and template exports.
One feature-organized package is sufficient until distribution or dependency evidence justifies a
split.

## Semantic primitives

Lotus Lilium templates declare semantic identities such as sidebar root, content, toggle, label,
or action. They do not declare HTML tags.

```ts
const SidebarRoot = Template.primitive("LotusSidebarRoot");
const SidebarToggle = Template.primitive("LotusSidebarToggle");
```

The DOM adapter may map them to `aside` and `button`. Another target may map the same identities to
native values. Exact identity imports preserve deterministic preflight without name registries.

If a target cannot implement a declared semantic capability, mount fails during preflight before
Component setup or target mutation.

## Portable callbacks and events

Target-independent Lotus packages do not expose `MouseEvent`, `KeyboardEvent`, `HTMLElement`, or
another platform event class. They define semantic callback inputs when event details are needed:

```ts
interface LotusPressEvent {
    readonly source: "pointer" | "keyboard" | "programmatic";
}
```

`@lotus/lilium` uses that type in its callback-valued `TemplateProperty`.
`@lotus/lilium-dom` translates browser events into the portable value before invoking the
candidate through Renderer host execution. A future native adapter translates its event model into
the same semantic value.

Using a native `button` permits the browser to supply accessible keyboard activation through its
normal click behavior. More complex semantic interactions remain Lotus target-adapter
responsibilities rather than Renderer DOM defaults.

## Persistence and services

Headless UI behavior cannot select `localStorage` implicitly. A portable component may accept an
optional persistence contract or resolve one through a framework adapter, but platform storage
implementations remain outside the headless core.

For a Lilium adapter, persistence can be supplied through explicit inputs, Context, or another
owned service composition. Valid implementations include no persistence, memory storage,
`localStorage`, remote storage, and future native storage.

Cross-component coordination such as `closeAll()` or `openOnly()` belongs to an explicitly owned
group or collection service. It cannot use process-global static managers that outlive
applications and bypass disposal.

## Reference Lotus migration

The existing Lotus prototype demonstrates useful domain concepts but is not the target
architecture. A future clean rewrite should preserve behavior such as sidebar open, close, toggle,
and group coordination while removing:

- direct `HTMLElement` ownership from core controllers;
- constructor registration side effects;
- process-global static component managers;
- implicit global `localStorage`;
- non-reactive framework state;
- persistence mixed into visual component behavior;
- DOM listeners created outside a target adapter.

The rewrite should begin from contracts and behavior scenarios after a stable Lilium browser
milestone. Lilium does not copy or absorb Lotus implementation code.

## Installation and selection

An installer may offer Lotus as an optional application dependency, but installation choices do
not alter framework package boundaries.

Conceptually:

```text
Lilium only:
    install Lilium packages selected by the application

Lilium plus Lotus headless/default templates:
    add @lotus/lilium

Lilium plus Lotus default DOM presentation:
    add @lotus/lilium and @lotus/lilium-dom
```

Manual components, another UI library, or application-specific primitives remain equally valid.
`@lilium/renderer-dom` accepts any complete compatible implementation set and never privileges
Lotus.

## Independence proof

The model preserves all required directions:

```text
Lotus headless behavior
    does not know Lilium or DOM

Lotus Lilium definitions
    know Lilium declarations but not a target

Lotus DOM mappings
    know Renderer DOM and Lotus Lilium identities

Renderer DOM
    knows Renderer and DOM but not Lotus

Lilium application
    selects and composes all desired packages
```

Lotus can replace Lilium adapters without changing its headless domain. Lilium can use another UI
library without changing any framework package. The application remains the only composition root
that intentionally knows both complete package families.

