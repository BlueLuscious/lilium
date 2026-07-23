# Renderer Conformance

Status: **Complete for the first universal ABI**

Conformance verifies Renderer through public package behavior and host-protocol observations. It
does not expose a production feature or package subpath. The canonical semantics remain in the
[Renderer Protocol](../../../architecture/renderer-protocol.md); this document defines how the
repository proves them.

## Recording Host

The internal test fixture implements `RendererHost` with opaque root and value handles. Its
primitive support declarations configure exact Template capability identities, child support, and
property support. Optional hooks inject failures independently into opening, resolution, creation,
writing, placement, removal, release, and closure.

The fixture maintains two observations:

- `calls` records ordered protocol invocations, including an attempted operation that throws;
- `trace` records successful host mutations and terminal closure with their opaque handles.

Counters and read-only host state support focused assertions, but complete conformance scenarios
assert call order rather than Renderer implementation classes.

## Scenarios

| Scenario | Verified behavior |
| --- | --- |
| Preflight | Capability resolution precedes every creation or mutation; incompatibility closes the session with zero host mutations. |
| Mount | Parent and child values are created detached, properties are written before placement, children attach before application roots, and the mount returns a frozen lifecycle handle. |
| Update | Dependency retracking reaches only eligible bindings, equal candidates produce no host write, and changed candidates reuse existing handles. |
| Component and projection | Complete input snapshots, attachment ownership, slot inputs, fallback selection, and nested failure isolation compose through Core and Component bridges. |
| Unmount | Bindings stop first, descendants and roots detach in reverse ownership order, values release in reverse creation order, and the session closes once. |
| Failure | Injected initial and dynamic failures terminalize the correct occurrence, roll back every successful operation, preserve error identity and ordering, and prevent later writes. |

## Package ABI

The built-package tests import `@lilium/renderer` through its package export map. They snapshot the
single frozen runtime export, mount and dispose through compiled dependencies, and prove that
implementation subpaths remain inaccessible. Type tests separately verify every public contract,
generic relationship, mount option, and host capability boundary.

No DOM, browser, server, console, or native concept appears in production Renderer code or in the
universal scenarios. A concrete adapter must implement the public host contracts and pass these
same observable requirements without changing Renderer.

The private [Renderer Console package](../../renderer-console/index.md) is the first external
adapter used to prove this boundary outside Renderer tests.
