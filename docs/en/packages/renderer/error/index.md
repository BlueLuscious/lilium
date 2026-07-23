# Renderer Errors

Status: **Structured Renderer errors and terminal routing implemented**

Renderer defines structured errors only for failures it originates. Errors thrown by host
adapters remain opaque application values and are routed through Core ownership boundaries without
requiring a closed host-error hierarchy.

## Contracts

| Contract | Responsibility | Relationships |
| --- | --- | --- |
| `RendererCompatibilityError` | Represent deterministic host capability incompatibility discovered before mutation. | Carries `RendererCompatibilityIssueType` and `RendererCompatibilitySubjectType`. |
| `RendererProtocolError` | Represent an invalid synchronous host operation result. | Carries `RendererHostOperationType` and the invalid result. |
| `RendererRootClaimError` | Represent a duplicate active claim for one exact host and root pair. | Carries the rejected external root. |

## Types

| Type | Responsibility | Values or relationships |
| --- | --- | --- |
| `RendererCompatibilityIssueType` | Classify a preflight incompatibility. | `missing-primitive`, `missing-property`, `children-unsupported`, `primitive-mismatch`, or `property-mismatch`. |
| `RendererCompatibilitySubjectType` | Identify the unsupported Template capability. | `TemplatePrimitive` or `TemplateProperty`. |
| `RendererHostOperationType` | Identify the violated host operation. | Open, resolution, creation, write, placement, removal, release, or close. |

Compatibility failures occur before Component setup and host mutation. Protocol errors cover
Promise-like or non-undefined success results; they do not wrap ordinary adapter-thrown errors.
Concrete package-private errors implement all three contracts. Compatibility failures belong to
preflight, root-claim failures belong to session opening, and protocol failures may originate from
opening, capability resolution, creation, mutation, removal, release, or closure. Adapter-thrown
errors retain their original identity. Terminal routing and aggregation remain defined by
[Failure and terminal behavior](../../../architecture/renderer-protocol.md#failure-and-terminal-behavior).
