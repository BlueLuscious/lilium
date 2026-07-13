# `Effect`

`Effect` is an identity-bearing disposable object representing a synchronous tracked side effect.

It cannot execute manually. Creation schedules its callback in the runtime effect phase after renderer bindings; computed values reevaluate lazily when the callback reads them. Multiple invalidations before a flush produce one pending execution.

When created outside a batch or active flush, automatic synchronous flushing executes the initial effect before `ReactiveRuntime.effect()` returns. Creation during an earlier scheduler phase follows normal current-cycle rules; creation during the effect phase enters the next cycle.

`dispose()` is idempotent. It cancels pending execution, disconnects dependencies, executes remaining cleanups, and prevents future invalidation. An active ownership scope also owns the effect automatically.

Reactive writes are allowed during execution but cannot reenter the running effect. They schedule a later propagation cycle subject to cycle detection.

See the [Effect Runtime](runtime/index.md) for the implemented execution, cleanup, failure, scheduling, and ownership flow.

See [`EffectExecution`](effect-execution.md), [`EffectFunctionType`](effect-function.md), [`EffectCleanupType`](effect-cleanup.md), and [Dependency Tracking](../tracking/index.md).
