# Renderer Session

Status: **Private runtime implemented**

The session feature owns one synchronous host session from successful opening through terminal
closure. It is package-private because applications construct sessions through the future
`RendererRuntime`, not as independent public resources.

## Runtime Concepts

| Concept | Responsibility | Relationships |
| --- | --- | --- |
| `RendererSessionManager<Root, Parent, Value>` | Claim a host-root pair, validate `RendererHost.open()`, and create one owned session. | Uses one `RendererHost` and the shared root-claim registry. |
| `RendererSession<Parent, Value>` | Guard preflight, ready access, closure, and claim release behind a terminal state machine. | Owns one `RendererHostSession` and one accepted capability registry. |
| `RendererRootClaimRegistry` | Enforce at most one active session for an exact host and root pair across manager instances. | Uses weak host identity and exact root identity/value keys. |

## Internal Type

| Type | Responsibility | Values |
| --- | --- | --- |
| `TRendererSessionState` | Represent the private irreversible session lifecycle. | `open`, `ready`, or `closed`. |

## Lifecycle

1. The manager claims the exact host-root pair before calling `host.open(root)`.
2. Invalid asynchronous or malformed open results release the claim and produce a
   `RendererProtocolError`.
3. An open wrapper accepts exactly one Template or Component preflight.
4. Successful preflight moves the wrapper to `ready` and enables host and capability access.
5. Failed preflight closes the host and releases the claim before propagating the failure.
6. Explicit closure marks the wrapper terminal before host cleanup and always releases the claim.

Repeated closure is idempotent. A closed wrapper cannot be reopened, preflighted, or used for host
execution. The external root remains borrowed and is never released by Renderer. See the canonical
[host-session semantics](../../../architecture/renderer-protocol.md#host-adapter-and-session).
