# Component Occurrence Runtime

The integration runtime consists of two concrete objects:

- `ComponentOccurrenceRuntime` retains one genuine Core runtime and the private shared component engine;
- `ComponentOccurrence` is the protected frozen adapter object retaining one hidden component lifecycle.

## Creation flow

1. `ComponentIntegration` validates the supplied Core runtime before retaining it.
2. The shared component engine validates inputs and owner, creates the private component scope, and runs setup exactly once.
3. A handled setup failure returns `undefined`; an unhandled failure propagates after incomplete setup ownership is released.
4. After successful setup, the lifecycle creates exactly one attachment child beneath its private component scope.
5. The lifecycle is wrapped independently as the regular public `ComponentInstance` and as the adapter occurrence.
6. Only `instance`, `attachment`, `updateInputs()`, and `dispose()` escape.

Occurrence materialization is atomic. If attachment or wrapper creation fails, the initialized
lifecycle is disposed before the failure propagates. Independent cleanup failure is preserved in an
`AggregateError` after the creation failure.

## Update flow

`updateInputs(values)` delegates one complete normalized snapshot to the hidden lifecycle. The
existing input store captures every value before writing, rejects missing or extra keys, and applies
accepted signal writes inside one Core batch. Setup does not execute again, while the public
instance, controller, input object, and read-only signals retain stable identities.

## Ownership and disposal

The attachment is registered after setup resources. Core LIFO ownership therefore disposes
attachment bindings, nested occurrences, and host resources before lifecycle state and setup
resources. Explicit occurrence disposal, public instance disposal, parent disposal, and runtime
disposal converge on the same idempotent component-scope operation.

Disposing one occurrence never mutates its reusable definition. A later occurrence receives a new
component scope, lifecycle, public instance, and attachment.
