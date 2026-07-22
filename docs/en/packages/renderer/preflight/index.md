# Renderer Preflight

Status: **Private runtime implemented**

The preflight feature proves host compatibility for the complete reachable normalized Template
graph before Component setup or host-value mutation. It resolves capabilities but never creates,
writes, places, removes, or releases host values.

## Runtime Concepts

| Concept | Responsibility | Relationships |
| --- | --- | --- |
| `RendererRequirementCollector` | Traverse a standalone Template or templated Component and collect ordered unique requirements. | Reads normalized Template nodes, nested components, outlets, and projections. |
| `RendererCapabilityPreflight<Parent, Value>` | Resolve and validate every required primitive, property, and child capability. | Uses one open `RendererHostSession`; creates structured Renderer errors. |
| `RendererCapabilityRegistry<Parent, Value>` | Retain accepted capabilities by exact Template identity for later instruction execution. | Created only by successful preflight and owned by `RendererSession`. |

## Internal Type

| Type | Responsibility | Relationships |
| --- | --- | --- |
| `TRendererPrimitiveRequirement` | Group one primitive identity, its unique properties, and whether an occurrence produces children. | Produced by collection and consumed by capability preflight. |

## Collection Rules

- Requirements preserve first-reachable-declaration order and deduplicate exact object identities.
- Repeated occurrences of one primitive merge their property and child requirements.
- Nested component templates are traversed without creating Component instances.
- A matching projection replaces an outlet fallback for that component occurrence.
- An outlet fallback is traversed only when no matching projection exists.
- Recursive malformed definition graphs fail before capability resolution can continue.

## Validation Rules

Preflight rejects missing primitive and property support, unsupported children, mismatched
capability identities, malformed capability objects, and Promise-like protocol results. Any
failure terminalizes the owning [Renderer Session](../session/index.md), and tests verify that the
host mutation count remains zero. See the canonical
[primitive-capability rules](../../../architecture/renderer-protocol.md#primitive-capabilities).
