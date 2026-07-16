# Ownership Runtime

The ownership runtime implements the accepted scope, error-boundary, and root-lifetime semantics without exposing mutable ledgers or concrete classes from the package root.

## `OwnershipManager`

`OwnershipManager` owns one runtime root ledger and every scope created through it. Root resources and explicit root scopes share that ledger. The manager also validates that active resources and scopes belong to the same runtime owner.

The manager routes owned failures from their original owner toward ancestor boundaries. A handled failure is removed, a propagated failure continues unchanged, and a throwing handler wraps the current failure and handler failure in an `AggregateError`. Boundary handlers execute through an injected untracked adapter so the final reactive runtime composition can suspend dependency tracking during recovery.

The scheduler uses `captureOwner()` when a job identity first becomes pending and `executeOwned()` when that job runs. Scope-owned work restores active ownership and boundary traversal; root-owned work uses the runtime root error path without a synthetic scope.

Render bindings additionally use `deferFailure()` after cancelling failed work. The manager waits
for the outermost owned execution to unwind, invokes terminal finalization untracked, and only then
routes the original or aggregated failure from its captured semantic owner. This permits a
terminalizer to dispose the failed occurrence without weakening the public rule that active scopes
cannot be disposed.

## `ScopeRuntime`

`ScopeRuntime` implements both the public `Scope` contract and the internal [`IContextScope`](../../context/internal/context-scope.md) bridge.

Each scope stores child scopes, user cleanups, and future reactive resources in one registration-ordered ledger. Disposal walks the ledger in last-in-first-out order and shares one internal error collection across the complete subtree. Consequently, each cleanup failure passes through ownership boundaries exactly once.

Provider registration closes when the scope begins its first execution. Disposal clears provider storage and permanently closes every operation except repeated `dispose()`.

## `ErrorBoundaryRuntime`

`ErrorBoundaryRuntime` specializes `ScopeRuntime` with one immutable handler and the nominal public `ErrorBoundary` identity. The handler is not exposed as mutable state.

## Active ownership

`OwnershipContextManager` maintains the synchronous active-owner stack shared by all Core runtimes. The shared stack is required because one portable Context identity can resolve against scopes from different runtimes. Individual `OwnershipManager` instances still isolate ledgers and reject cross-runtime resource registration.

Nested execution and recovery always restore the previous owner in a finalization step. Recovery exposes the handling boundary for Context lookup while rejecting scope execution and ownership mutation until the handler completes.

## Disposal flow

1. Reject disposal when the owner or one of its descendants is active.
2. Mark the owner as disposing.
3. Execute every ledger entry in reverse registration order.
4. Route each failure from its owning scope through ancestor boundaries.
5. Close the owner and clear its ledger and providers in a finalization step.
6. Throw one unhandled failure directly or multiple failures as one `AggregateError`.

Repeated disposal is a no-op, including after a disposal pass reported errors.
