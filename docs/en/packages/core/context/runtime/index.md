# Context Runtime

`ContextRuntime<T>` is the internal immutable implementation of the public `Context<T>` contract.

Each instance stores only its identity and optional immutable default. `required()` constructs an identity without a default, while `withDefault(value)` constructs one with an explicit default, including `undefined`. The constructor remains private so invalid combinations cannot be represented.

Provider values remain in ownership scopes, so reusing one Context object across runtimes does not share values between their scope trees.

## Resolution flow

1. Read the current scope from the internal active-owner stack.
2. Ask its [`IContextScope`](../internal/context-scope.md) bridge for the nearest provider.
3. Return a found value, including an explicit `undefined` value.
4. Otherwise return the immutable default when configured.
5. Throw a standard `Error` when neither provider nor default exists.

## Provider flow

`provide(scope, value)` first verifies that Core registered the supplied scope as a compatible context scope. The scope then enforces one provider per Context identity, setup-only registration, and rejection after disposal.

The concrete class is internal. The future public `Context.create()` object API will construct and return it through the public contract.
