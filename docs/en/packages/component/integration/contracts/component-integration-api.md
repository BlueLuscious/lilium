# `ComponentIntegrationApi`

`ComponentIntegrationApi` is the object contract implemented by the frozen `ComponentIntegration`
value exported only from `@lilium/component/integration`.

`createRuntime(runtime)` borrows one public Core `ReactiveRuntime` and returns a
[`ComponentOccurrenceRuntime`](component-occurrence-runtime.md). The concrete API must reject
foreign runtime implementations and never owns or disposes the supplied runtime.

Validation delegates to the narrow `CoreIntegration.assertRuntime()` boundary. Component never
imports Core runtime implementation classes.

This contract remains separate from the root `ComponentApi` and `ComponentRuntime` contracts so
ordinary headless component consumers receive no Renderer authority.
