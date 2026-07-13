import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { EffectExecution } from "../../../src/reactivity/contracts/effect/effect-execution.contract.js";
import { TestReactiveRuntime } from "./reactive-runtime.fixture.js";

describe("effect runtime", () => {
    test("schedules initial execution and deduplicates batched invalidations", () => {
        const runtime = new TestReactiveRuntime();
        const source = runtime.signal(0);
        const values: number[] = [];
        const effect = runtime.effect(() => {
            values.push(source.get());
            return undefined;
        });

        assert.deepEqual(values, [0]);

        runtime.batch(() => {
            source.set(1);
            source.set(2);
            assert.deepEqual(values, [0]);
            return undefined;
        });

        assert.deepEqual(values, [0, 2]);
        effect.dispose();
    });

    test("replaces dynamic dependencies after successful executions", () => {
        const runtime = new TestReactiveRuntime();
        const selectFirst = runtime.signal(true);
        const first = runtime.signal(1);
        const second = runtime.signal(10);
        const values: number[] = [];
        const effect = runtime.effect(() => {
            values.push(selectFirst.get() ? first.get() : second.get());
            return undefined;
        });

        selectFirst.set(false);
        first.set(2);
        second.set(11);

        assert.deepEqual(values, [1, 10, 11]);
        effect.dispose();
    });

    test("releases committed cleanups in LIFO order before rerun and disposal", () => {
        const runtime = new TestReactiveRuntime();
        const source = runtime.signal(0);
        const order: string[] = [];
        let retainedExecution!: EffectExecution;
        const effect = runtime.effect((execution) => {
            const value = source.get();
            retainedExecution = execution;
            order.push(`run:${value}`);
            execution.cleanup(() => {
                order.push(`cleanup:${value}:first`);
                return undefined;
            });
            execution.cleanup(() => {
                order.push(`cleanup:${value}:last`);
                return undefined;
            });
            return undefined;
        });

        assert.throws(
            () => retainedExecution.cleanup(() => undefined),
            /outside an active effect execution/,
        );

        source.set(1);
        effect.dispose();
        effect.dispose();

        assert.deepEqual(order, [
            "run:0",
            "cleanup:0:last",
            "cleanup:0:first",
            "run:1",
            "cleanup:1:last",
            "cleanup:1:first",
        ]);
    });

    test("rolls back failed attempts and releases candidate cleanups", () => {
        const runtime = new TestReactiveRuntime();
        const trigger = runtime.signal(0);
        const candidate = runtime.signal(0);
        const failure = new Error("effect failed");
        const order: string[] = [];
        let fail = false;
        const root = runtime.ownership.scope();
        const boundary = root.boundary((event) => {
            assert.equal(event.error, failure);
            order.push("handled");
            return "handled";
        });
        let effect!: ReturnType<typeof runtime.effect>;

        boundary.run(() => {
            effect = runtime.effect((execution) => {
                if (fail) {
                    candidate.get();
                    execution.cleanup(() => {
                        order.push("candidate:first");
                        return undefined;
                    });
                    execution.cleanup(() => {
                        order.push("candidate:last");
                        return undefined;
                    });
                    throw failure;
                }

                order.push(`success:${trigger.get()}`);
                return undefined;
            });
        });

        fail = true;
        trigger.set(1);
        candidate.set(1);
        fail = false;
        trigger.set(2);

        assert.deepEqual(order, [
            "success:0",
            "candidate:last",
            "candidate:first",
            "handled",
            "success:2",
        ]);
        effect.dispose();
    });

    test("aggregates callback and candidate cleanup failures", () => {
        const runtime = new TestReactiveRuntime();
        const source = runtime.signal(0);
        const callbackFailure = new Error("callback");
        const firstCleanupFailure = new Error("first candidate cleanup");
        const lastCleanupFailure = new Error("last candidate cleanup");
        let fail = false;
        let handledError: unknown;
        const root = runtime.ownership.scope();
        const boundary = root.boundary((event) => {
            handledError = event.error;
            return "handled";
        });

        boundary.run(() => {
            runtime.effect((execution) => {
                source.get();

                if (fail) {
                    execution.cleanup(() => {
                        throw firstCleanupFailure;
                    });
                    execution.cleanup(() => {
                        throw lastCleanupFailure;
                    });
                    throw callbackFailure;
                }

                return undefined;
            });
        });

        fail = true;
        source.set(1);

        assert.ok(handledError instanceof AggregateError);
        assert.deepEqual(handledError.errors, [
            callbackFailure,
            lastCleanupFailure,
            firstCleanupFailure,
        ]);
    });

    test("attempts every failing cleanup and retries through prior dependencies", () => {
        const runtime = new TestReactiveRuntime();
        const source = runtime.signal(0);
        const firstFailure = new Error("first cleanup");
        const lastFailure = new Error("last cleanup");
        const cleanupOrder: string[] = [];
        let executions = 0;
        let handledError: unknown;
        const root = runtime.ownership.scope();
        const boundary = root.boundary((event) => {
            handledError = event.error;
            return "handled";
        });

        boundary.run(() => {
            runtime.effect((execution) => {
                executions += 1;
                source.get();

                if (executions === 1) {
                    execution.cleanup(() => {
                        cleanupOrder.push("first");
                        throw firstFailure;
                    });
                    execution.cleanup(() => {
                        cleanupOrder.push("last");
                        throw lastFailure;
                    });
                }

                return undefined;
            });
        });

        source.set(1);
        assert.equal(executions, 1);
        assert.deepEqual(cleanupOrder, ["last", "first"]);
        assert.ok(handledError instanceof AggregateError);
        assert.deepEqual(handledError.errors, [lastFailure, firstFailure]);

        source.set(2);
        assert.equal(executions, 2);
    });

    test("routes disposal cleanup errors and attempts every registered cleanup", () => {
        const runtime = new TestReactiveRuntime();
        const firstFailure = new Error("first disposal cleanup");
        const lastFailure = new Error("last disposal cleanup");
        const order: string[] = [];
        let handledError: unknown;
        const root = runtime.ownership.scope();
        const boundary = root.boundary((event) => {
            handledError = event.error;
            return "handled";
        });

        boundary.run(() => {
            runtime.effect((execution) => {
                execution.cleanup(() => {
                    order.push("first");
                    throw firstFailure;
                });
                execution.cleanup(() => {
                    order.push("last");
                    throw lastFailure;
                });
                return undefined;
            });
        });

        assert.doesNotThrow(() => boundary.dispose());
        assert.deepEqual(order, ["last", "first"]);
        assert.ok(handledError instanceof AggregateError);
        assert.deepEqual(handledError.errors, [lastFailure, firstFailure]);
    });

    test("self-invalidates into later scheduler cycles without recursive execution", () => {
        const runtime = new TestReactiveRuntime();
        const source = runtime.signal(0);
        const values: number[] = [];
        let active = false;

        const effect = runtime.effect(() => {
            assert.equal(active, false);
            active = true;
            const value = source.get();
            values.push(value);

            if (value < 3) {
                source.set(value + 1);
            }

            active = false;
            return undefined;
        });

        assert.deepEqual(values, [0, 1, 2, 3]);
        effect.dispose();
    });

    test("cancels an initial execution disposed before a batch exits", () => {
        const runtime = new TestReactiveRuntime();
        let executions = 0;

        runtime.batch(() => {
            const effect = runtime.effect(() => {
                executions += 1;
                return undefined;
            });
            effect.dispose();
            return undefined;
        });

        assert.equal(executions, 0);
    });

    test("disconnects candidate dependencies when disposing during execution", () => {
        const runtime = new TestReactiveRuntime();
        const source = runtime.signal(0);
        const incidental = runtime.signal(0);
        let cleanups = 0;
        let executions = 0;
        let effect!: ReturnType<typeof runtime.effect>;

        runtime.batch(() => {
            effect = runtime.effect((execution) => {
                executions += 1;
                source.get();
                execution.cleanup(() => {
                    incidental.get();
                    cleanups += 1;
                    return undefined;
                });
                effect.dispose();
                return undefined;
            });
            return undefined;
        });

        source.set(1);
        incidental.set(1);

        assert.equal(executions, 1);
        assert.equal(cleanups, 1);
    });
});
