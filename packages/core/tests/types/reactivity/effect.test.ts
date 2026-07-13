import type {
    Effect,
    EffectCleanupType,
    EffectExecution,
    EffectFunctionType,
    ReactiveRuntime,
    Signal,
} from "../../../src/index.js";

declare const runtime: ReactiveRuntime;
declare const signal: Signal<number>;

const cleanup: EffectCleanupType = () => {};

const effectFunction: EffectFunctionType = (execution) => {
    signal.get();
    execution.cleanup(cleanup);
};

const effect: Effect = runtime.effect(effectFunction);

effect.dispose();

runtime.effect((execution: EffectExecution) => {
    execution.cleanup(() => {});
});

// @ts-expect-error Effects cannot be executed manually.
effect.run();

// @ts-expect-error Effect callbacks must be synchronous.
runtime.effect(async () => undefined);

// @ts-expect-error Effect callbacks cannot return values.
runtime.effect(() => 1);

runtime.effect((execution) => {
    // @ts-expect-error Cleanup callbacks must be synchronous.
    execution.cleanup(async () => undefined);

    return undefined;
});
