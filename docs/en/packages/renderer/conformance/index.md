# Renderer Conformance

Status: **Shared external-adapter verification implemented**

Conformance verifies Renderer through public package behavior and host-protocol observations. It
is available through the opt-in `@lilium/renderer/conformance` developer subpath and is absent from
the package root. The canonical semantics remain in the
[Renderer Protocol](../../../architecture/renderer-protocol.md); this feature defines how concrete
host adapters prove them without importing Renderer implementation modules.

## Contracts And Types

| Contract or type | Responsibility | Relationships |
| --- | --- | --- |
| `RendererConformanceApi` | Create the canonical scenario set for one adapter. | Implemented by the frozen `RendererConformance` facade. |
| `RendererConformanceAdapter` | Create an independently observable host from portable options. | Implemented by test bridges for the internal recording host, Console, and future adapters. |
| `RendererConformanceHost` | Pair a public `RendererHost` with normalized attempted/completed operation and tree observations. | Returned by `RendererConformanceAdapter.createHost()`. |
| `RendererConformanceScenario` | Expose one stable scenario name and runner-neutral execution method. | Returned by `RendererConformance.scenarios()`. |
| `RendererConformanceAssertions` | Define only the equality, truthiness, and synchronous failure assertions required by scenarios. | Implemented by Node tests or another test runner without a production Node dependency. |
| `RendererConformanceHostOptionsType` | Configure portable primitive support, omissions, and operation failures. | Passed unchanged to every adapter. |
| `RendererConformancePrimitiveSupportType` | Declare one primitive, child support, and exact properties. | Contained by host options. |
| `RendererConformanceFailureType` | Select one host operation occurrence and exact error value. | Contained by host options and reset by adapters per opening attempt. |
| `RendererConformanceRootType` | Provide the common external object root shape. | Used by the host protocol and all observations. |
| `RendererConformanceValueSnapshotType` | Normalize one recursive logical value independently from host handles. | Returned by `RendererConformanceHost.snapshot()`. |
| `RendererConformancePropertySnapshotType` | Normalize one exact property identity and latest value. | Contained by value snapshots. |

## Runtime Concepts

| Concept | Responsibility | Relationships |
| --- | --- | --- |
| `RendererConformance` | Provide the only runtime value of the developer subpath. | Delegates scenario creation to `RendererConformanceScenarioFactory`. |
| `RendererConformanceScenarioFactory` | Own the canonical Template identities and construct fresh host-neutral scenarios. | Uses only Core, Template, the public Renderer facade, and conformance contracts. |

Scenario code has no Node, Console, DOM, server, or native dependency. Test files register each
returned scenario with their runner and provide its assertion bridge. Adapter-specific code is
limited to capability construction and observation normalization; scenario bodies contain no
host-specific branch.

## Scenarios

| Scenario | Verified behavior |
| --- | --- |
| Preflight | Omitted primitive and property support close the session with zero host mutations. |
| Mount | Parent and child values are created detached, properties are written before placement, children attach before application roots, and the mount returns a frozen lifecycle handle. |
| Update | Equal derived candidates produce no write; changed candidates update existing handles. |
| Unmount | Bindings stop first, descendants and roots detach in reverse ownership order, values release in reverse creation order, and the session closes once. |
| Placement failure | A failed root placement preserves completed child placement until deterministic rollback removes and releases all values. |
| Dynamic failure | A failed reactive write terminalizes the application, cancels later binding execution, and closes the session. |
| Cleanup failure | Every remove, release, and close is attempted; errors retain cleanup order and the external root can be claimed again. |

## Package ABI

Built-package tests import both `@lilium/renderer` and `@lilium/renderer/conformance` through the
declared export map. The root still exposes only `Renderer`; the developer subpath exposes only the
frozen `RendererConformance` value and erased contracts/types. Runtime implementation paths below
either boundary remain inaccessible.

The internal recording fixture and private
[Renderer Console package](../../renderer-console/index.md) register the exact same six scenarios.
Console therefore proves the protocol outside Renderer tests while Renderer semantics and scenario
logic remain unchanged. Future DOM, SSR, and native adapters can implement the same test boundary.
