# `ScopeCleanupType`

`ScopeCleanupType` is a synchronous zero-argument cleanup registered through `Scope.cleanup()`.

It returns `undefined`, rejecting async cleanup and accidental return values at the TypeScript boundary. Scope cleanups execute without reactive dependency tracking as entries in the scope's last-in-first-out ownership stack.

See [`Scope`](index.md).
