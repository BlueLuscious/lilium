# Renderer Shared Runtime

Status: **Private runtime implemented**

`shared/` contains only behavior that is genuinely reused across Renderer features. It is not a
public package subpath and has no barrel.

| Concept | Responsibility | Relationships |
| --- | --- | --- |
| `RendererCleanupCollector` | Attempt independent synchronous cleanup, flatten nested aggregate failures, and preserve execution order. | Used by application, execution, and runtime terminal paths. |

The collector throws one original error directly and creates `AggregateError` only for multiple
failures. It does not route errors or own resources; Core ownership remains responsible for error
boundaries, while the caller determines the cleanup sequence.
