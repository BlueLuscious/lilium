# `EffectFunctionType`

`EffectFunctionType` is a synchronous tracked callback executed during the scheduler effect phase.

It receives an [`EffectExecution`](../contracts/effect-execution.md) object and returns `undefined`. Using `undefined` instead of `void` rejects async callbacks and accidental return values at the TypeScript boundary.

The callback may read reactive sources, register cleanups, and perform reactive writes. Writes schedule a later cycle and never reenter the active execution.

See [`Effect`](../contracts/effect.md) and [Dependency Tracking](../dependency-tracking.md).
