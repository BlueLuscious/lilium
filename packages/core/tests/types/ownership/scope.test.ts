import type {
    Computed,
    Effect,
    ReactiveRuntime,
    Scope,
    ScopeCleanupType,
    ScopeFunctionType,
} from "../../../src/index.js";

declare const runtime: ReactiveRuntime;

const scope: Scope = runtime.scope();
const child: Scope = scope.child();

const cleanup: ScopeCleanupType = () => {};
const operation: ScopeFunctionType = () => {
    const computed: Computed<number> = runtime.computed(() => 1);
    const effect: Effect = runtime.effect(() => {});

    void computed;
    void effect;
};

scope.cleanup(cleanup);
scope.run(operation);
child.dispose();
scope.dispose();
runtime.dispose();

// @ts-expect-error Scope operations must be synchronous.
scope.run(async () => undefined);

// @ts-expect-error Scope operations cannot return values.
scope.run(() => 1);

// @ts-expect-error Scope cleanups must be synchronous.
scope.cleanup(async () => undefined);

// @ts-expect-error Scope cleanups cannot return values.
scope.cleanup(() => 1);
