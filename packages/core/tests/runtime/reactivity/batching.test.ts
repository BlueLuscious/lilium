import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { TestReactiveRuntime } from "./reactive-runtime.fixture.js";

describe("batching runtime", () => {
    test("applies writes immediately and flushes once after the outermost boundary", () => {
        const runtime = new TestReactiveRuntime();
        const source = runtime.signal(0);
        const computed = runtime.computed(() => source.get() * 2);
        const values: number[] = [];
        const effect = runtime.effect(() => {
            values.push(computed.get());
            return undefined;
        });

        runtime.batch(() => {
            source.set(1);
            assert.equal(source.get(), 1);
            assert.equal(computed.get(), 2);
            assert.deepEqual(values, [0]);

            runtime.batch(() => {
                source.set(2);
                assert.equal(computed.get(), 4);
                assert.deepEqual(values, [0]);
                return undefined;
            });

            source.set(3);
            assert.deepEqual(values, [0]);
            return undefined;
        });

        assert.deepEqual(values, [0, 6]);
        effect.dispose();
    });

    test("keeps an outer batch active when it catches an inner failure", () => {
        const runtime = new TestReactiveRuntime();
        const source = runtime.signal(0);
        const failure = new Error("inner batch");
        const values: number[] = [];
        const effect = runtime.effect(() => {
            values.push(source.get());
            return undefined;
        });

        runtime.batch(() => {
            assert.throws(
                () => runtime.batch(() => {
                    source.set(1);
                    throw failure;
                }),
                (error) => error === failure,
            );
            source.set(2);
            assert.deepEqual(values, [0]);
            return undefined;
        });

        assert.deepEqual(values, [0, 2]);
        effect.dispose();
    });

    test("preserves writes, flushes work, and rethrows the original batch error", () => {
        const runtime = new TestReactiveRuntime();
        const source = runtime.signal(0);
        const failure = new Error("batch failed");
        const values: number[] = [];
        const effect = runtime.effect(() => {
            values.push(source.get());
            return undefined;
        });

        assert.throws(
            () => runtime.batch(() => {
                source.set(1);
                throw failure;
            }),
            (error) => error === failure,
        );

        assert.equal(source.get(), 1);
        assert.deepEqual(values, [0, 1]);
        effect.dispose();
    });

    test("aggregates independent batch callback and flush failures", () => {
        const runtime = new TestReactiveRuntime();
        const source = runtime.signal(0);
        const batchFailure = new Error("batch failed");
        const effectFailure = new Error("effect failed");
        let failEffect = false;
        const effect = runtime.effect(() => {
            source.get();

            if (failEffect) {
                throw effectFailure;
            }

            return undefined;
        });

        failEffect = true;

        assert.throws(
            () => runtime.batch(() => {
                source.set(1);
                throw batchFailure;
            }),
            (error) => {
                assert.ok(error instanceof AggregateError);
                assert.deepEqual(error.errors, [batchFailure, effectFailure]);
                return true;
            },
        );

        effect.dispose();
    });

    test("does not roll back writes that return to their initial batch value", () => {
        const runtime = new TestReactiveRuntime();
        const source = runtime.signal(0);
        let executions = 0;
        const effect = runtime.effect(() => {
            source.get();
            executions += 1;
            return undefined;
        });

        runtime.batch(() => {
            source.set(1);
            source.set(0);
            return undefined;
        });

        assert.equal(source.get(), 0);
        assert.equal(executions, 2);
        effect.dispose();
    });
});
