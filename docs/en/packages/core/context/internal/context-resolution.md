# `TContextResolution<T>`

`TContextResolution<T>` is the internal discriminated result returned by `IContextScope.resolveContext()`.

- `{ found: true, value }` represents the nearest provider, including an explicit `undefined` value.
- `{ found: false }` represents an absent provider and contains no value property.

The explicit discriminant prevents context resolution from using truthiness or `undefined` as provider-presence checks.

See [`IContextScope`](context-scope.md).
