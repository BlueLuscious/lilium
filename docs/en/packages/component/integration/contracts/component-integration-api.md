# `ComponentIntegrationApi`

`ComponentIntegrationApi` is the object contract for the future `ComponentIntegration` value
exported only from `@lilium/component/integration`.

`createRuntime(runtime)` borrows one public Core `ReactiveRuntime` and returns a
[`ComponentOccurrenceRuntime`](component-occurrence-runtime.md). The concrete API must reject
foreign runtime implementations and never owns or disposes the supplied runtime.

This contract remains separate from the root `ComponentApi` and `ComponentRuntime` contracts so
ordinary headless component consumers receive no Renderer authority.
