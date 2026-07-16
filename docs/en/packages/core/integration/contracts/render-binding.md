# `RenderBinding`

`RenderBinding` is the stable identity-bearing handle returned after successful initial render
evaluation. Object identity is the binding identity; no public identifier is required.

It exposes only `dispose()`. Disposal cancels pending work, disconnects tracked dependencies, and
permanently prevents another execution. It is idempotent.

The contract deliberately omits manual execution, invalidation, phase selection, queue access, and
dependency graph mutation. Those responsibilities remain inside Core.
