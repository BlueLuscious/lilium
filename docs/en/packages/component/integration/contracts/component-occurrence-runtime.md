# `ComponentOccurrenceRuntime`

`ComponentOccurrenceRuntime` creates Renderer-owned component occurrences through
`create(definition, options)`. It accepts the same public `ComponentDefinition` and complete
`ComponentCreateOptionsType` used by the headless runtime.

Creation runs atomic component setup exactly once. A handled setup failure returns `undefined`; an
unhandled failure propagates after incomplete ownership is released. The dedicated attachment scope
is created beneath the private component scope only after setup succeeds.

The runtime returns [`ComponentOccurrence`](component-occurrence.md) rather than the mutable engine
lifecycle and exposes no engine or runtime disposal method.

If occurrence materialization fails after setup, the runtime disposes the initialized lifecycle
before propagating the creation failure. A disposal failure is aggregated after the original
materialization failure.
