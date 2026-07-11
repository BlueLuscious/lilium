# Execution Model

Status: **Draft**

## Component creation

A component definition is immutable and reusable. Mounting it creates a component instance inside an ownership scope. The instance initializes its setup logic once, instantiates its template, and registers dynamic bindings as reactive consumers.

Component state changes do not execute the whole component again. They invalidate only consumers that tracked the changed state.

## Proposed update phases

1. **Write**: one or more reactive values are changed.
2. **Invalidate**: dependent computations and bindings are marked stale.
3. **Compute**: stale computed values required by consumers are refreshed.
4. **Render**: affected renderer bindings update their host nodes.
5. **Effect**: affected user effects execute after visible updates.
6. **Cleanup**: replaced executions and disposed scopes release resources.

The exact sync and async boundaries remain open. The required guarantee is that phase ordering is deterministic and documented.

## Template model

A template contains stable structure plus dynamic binding declarations. A binding reads reactive values and applies its latest result through renderer operations. This enables fine-grained updates without diffing complete trees.

The template representation is an implementation boundary, not necessarily a public serializable format. A stable compiled component ABI must be defined before the `.lily` compiler is implemented.

## Disposal

Unmounting an application disposes its root scope. Disposal recursively removes renderer bindings, effects, computations, component instances, host nodes, and registered cleanups. Repeated disposal must be safe.

## Error boundaries

The foundation must define how errors move through owner and component boundaries. Error recovery behavior is still open and must be specified before runtime implementation.

## Open decisions

- Synchronous or deferred default rendering.
- Lazy or eager computed evaluation.
- Render effects as a distinct computation category.
- Cleanup timing relative to reruns and DOM removal.
- Cycle detection and maximum propagation depth.
- Error boundary ownership and recovery semantics.
