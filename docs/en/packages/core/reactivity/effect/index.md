# `Effect`

`Effect` is an identity-bearing disposable object representing a synchronous tracked side effect.

It cannot execute manually. Creation schedules its callback in the runtime effect phase, after computed work and renderer bindings. Multiple invalidations before a flush produce one pending execution.

`dispose()` is idempotent. It cancels pending execution, disconnects dependencies, executes remaining cleanups, and prevents future invalidation. An active ownership scope also owns the effect automatically.

Reactive writes are allowed during execution but cannot reenter the running effect. They schedule a later propagation cycle subject to cycle detection.

See [`EffectExecution`](effect-execution.md), [`EffectFunctionType`](effect-function.md), [`EffectCleanupType`](effect-cleanup.md), and [Dependency Tracking](../tracking/index.md).
