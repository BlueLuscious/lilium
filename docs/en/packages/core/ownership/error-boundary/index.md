# `ErrorBoundary`

`ErrorBoundary` is a specialized child `Scope` with one immutable synchronous error handler.

It is an opaque nominal handle: a plain `Scope` cannot be treated as an error boundary even though both expose the same ownership operations.

## Creation

`scope.boundary(handler)` creates a child boundary owned by that scope. The returned object retains every `Scope` operation and owns resources using the same last-in-first-out ledger.

## Propagation

Failures travel from the nearest owner toward parent boundaries. A handler returns one explicit decision:

- `"handled"` stops propagation.
- `"propagate"` forwards the original error unchanged.

When a handler throws, the original error and handler error are combined in an `AggregateError` and propagated to the next parent boundary. Without another boundary, the synchronous runtime caller receives that aggregate.

## Covered execution

Boundaries intercept failures from owned scope operations, scheduled jobs, effect callbacks, effect and scope cleanups, component or renderer work, and disposal.

Direct imperative failures remain synchronous. Signal equality, a direct computed read, context lookup, provider registration, or batch callback throws to its caller unless that call occurs inside an owned operation already protected by a boundary.

## Handler execution

Handlers execute synchronously and without dependency tracking. They may perform reactive writes, which follow normal scheduler reentry rules, but cannot create new owned resources while recovery is active.

A handled failure does not rerun the failed operation automatically. Effects may retry after a later invalidation, computed values remain stale for a later read, and scope operations return after their aborted callback is handled.

## Disposal errors

Disposal always attempts every ledger entry. Handled errors are removed from the unhandled set. One remaining error is thrown directly; multiple remaining errors are reported as an `AggregateError` after disposal finishes.

See [`ErrorBoundaryEvent`](error-boundary-event.md), [`ErrorBoundaryFunctionType`](error-boundary-function.md), [`ErrorBoundaryDecisionType`](error-boundary-decision.md), and [Scope](../scope/index.md).
