import type {
    BatchFunctionType,
    ReactiveRuntime,
    Signal,
} from "../../../src/index.js";

declare const first: Signal<number>;
declare const runtime: ReactiveRuntime;
declare const second: Signal<number>;

const operation: BatchFunctionType = () => {
    first.set(1);
    second.update((value) => value + 1);
};

runtime.batch(operation);

runtime.batch(() => {
    first.set(2);

    runtime.batch(() => {
        second.set(2);
    });
});

// @ts-expect-error Batch operations must be synchronous.
runtime.batch(async () => undefined);

// @ts-expect-error Batch operations cannot return values.
runtime.batch(() => 1);
