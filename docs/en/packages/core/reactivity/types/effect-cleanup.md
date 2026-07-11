# `EffectCleanupType`

`EffectCleanupType` is a synchronous zero-argument operation that releases one resource registered by an effect execution.

It returns `undefined`, which rejects async cleanup callbacks and accidental return values at the type boundary. Cleanup operations execute without dependency tracking in last-in-first-out order.

See [`EffectExecution`](../contracts/effect-execution.md).
