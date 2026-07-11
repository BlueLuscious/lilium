# `EffectExecution`

`EffectExecution` is an execution-scoped object passed to an `EffectFunctionType` callback. It registers synchronous cleanup operations through `cleanup()`.

Multiple cleanups are supported and execute in last-in-first-out order before reevaluation or during disposal. Cleanup execution is untracked, and each registration runs at most once.

The object is valid only during its callback. Retaining it and attempting to register cleanups afterward is invalid.

See [`Effect`](effect.md) and [`EffectCleanupType`](../types/effect-cleanup.md).
