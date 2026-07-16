import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Runtime } from "../../../src/index.js";
import { CoreIntegration } from "../../../src/integration/index.js";
import type { RenderBindingFunctionType } from "../../../src/integration/types/render-binding-function.type.js";
import type { ReactiveRuntime } from "../../../src/reactivity/contracts/reactive-runtime.contract.js";
import type { Signal } from "../../../src/reactivity/contracts/signal/signal.contract.js";

describe("render binding integration", () => {
    test("evaluates synchronously and replaces dynamic dependencies", () => {
        const runtime = Runtime.create();
        const bindings = CoreIntegration.createRuntime(runtime);
        const owner = runtime.scope();
        const selectFirst = runtime.signal(true);
        const first = runtime.signal(1);
        const second = runtime.signal(10);
        const values: number[] = [];

        owner.run(() => {
            const binding = bindings.create(
                () => {
                    values.push(selectFirst.get() ? first.get() : second.get());
                },
                () => assert.fail("Successful render work cannot terminalize."),
            );
            assert.ok(binding);
        });

        assert.deepEqual(values, [1]);
        selectFirst.set(false);
        first.set(2);
        second.set(11);

        assert.deepEqual(values, [1, 10, 11]);
        runtime.dispose();
    });

    test("deduplicates batched invalidations and renders before effects", () => {
        const runtime = Runtime.create();
        const bindings = CoreIntegration.createRuntime(runtime);
        const source = runtime.signal(0);
        const order: string[] = [];

        bindings.create(
            () => {
                order.push(`render:${source.get()}`);
            },
            () => assert.fail("Successful render work cannot terminalize."),
        );
        runtime.effect(() => {
            order.push(`effect:${source.get()}`);
        });
        order.length = 0;

        runtime.batch(() => {
            source.set(1);
            source.set(2);
            assert.deepEqual(order, []);
        });

        assert.deepEqual(order, ["render:2", "effect:2"]);
        runtime.dispose();
    });

    test("owns work created during binding execution under the captured scope", () => {
        const runtime = Runtime.create();
        const bindings = CoreIntegration.createRuntime(runtime);
        const owner = runtime.scope();
        const trigger = runtime.signal(0);
        let executions = 0;
        let owned: Signal<number> | undefined;

        owner.run(() => {
            bindings.create(
                () => {
                    trigger.get();
                    executions += 1;
                    owned ??= runtime.signal(1);
                },
                () => assert.fail("Successful render work cannot terminalize."),
            );
        });

        trigger.set(1);
        assert.equal(executions, 2);
        const ownedSignal = owned;
        assert.ok(ownedSignal);

        owner.dispose();
        assert.throws(() => ownedSignal.get(), /disposed signal/i);
        trigger.set(2);
        assert.equal(executions, 2);
        runtime.dispose();
    });

    test("terminalizes a handled dynamic failure after owned execution unwinds", () => {
        const runtime = Runtime.create();
        const bindings = CoreIntegration.createRuntime(runtime);
        const trigger = runtime.signal(0);
        const root = runtime.scope();
        const failure = new Error("render failed");
        const order: string[] = [];
        const boundary = root.boundary((event) => {
            assert.equal(event.error, failure);
            order.push("handled");
            return "handled";
        });
        const occurrence = boundary.child();
        let binding: ReturnType<typeof bindings.create>;
        let executions = 0;

        occurrence.run(() => {
            binding = bindings.create(
                () => {
                    executions += 1;

                    if (trigger.get() > 0) {
                        throw failure;
                    }
                },
                (error) => {
                    assert.equal(error, failure);
                    order.push("terminal");
                    occurrence.dispose();
                    binding?.dispose();
                    binding?.dispose();
                    trigger.set(2);
                },
            );
        });

        trigger.set(1);

        assert.deepEqual(order, ["terminal", "handled"]);
        assert.equal(executions, 2);
        assert.doesNotThrow(() => occurrence.dispose());
        runtime.dispose();
    });

    test("returns undefined after handled initial failure and then terminalizes", () => {
        const runtime = Runtime.create();
        const bindings = CoreIntegration.createRuntime(runtime);
        const root = runtime.scope();
        const failure = new Error("initial render failed");
        const order: string[] = [];
        const boundary = root.boundary((event) => {
            assert.equal(event.error, failure);
            order.push("handled");
            return "handled";
        });
        const occurrence = boundary.child();

        occurrence.run(() => {
            const binding = bindings.create(
                () => {
                    order.push("run");
                    throw failure;
                },
                () => {
                    order.push("terminal");
                    occurrence.dispose();
                },
            );

            assert.equal(binding, undefined);
            order.push("returned");
        });

        assert.deepEqual(order, ["run", "returned", "terminal", "handled"]);
        runtime.dispose();
    });

    test("aggregates propagated render and terminalization failures", () => {
        const runtime = Runtime.create();
        const bindings = CoreIntegration.createRuntime(runtime);
        const trigger = runtime.signal(0);
        const renderFailure = new Error("render failed");
        const terminalFailure = new Error("terminalization failed");
        let executions = 0;
        let terminalizations = 0;

        bindings.create(
            () => {
                executions += 1;

                if (trigger.get() > 0) {
                    throw renderFailure;
                }
            },
            () => {
                terminalizations += 1;
                throw terminalFailure;
            },
        );

        assert.throws(
            () => trigger.set(1),
            (error) => {
                assert.ok(error instanceof AggregateError);
                assert.deepEqual(error.errors, [renderFailure, terminalFailure]);
                return true;
            },
        );

        trigger.set(2);
        assert.equal(executions, 2);
        assert.equal(terminalizations, 1);
        runtime.dispose();
    });

    test("cancels pending batched work through idempotent disposal", () => {
        const runtime = Runtime.create();
        const bindings = CoreIntegration.createRuntime(runtime);
        const source = runtime.signal(0);
        let executions = 0;
        const binding = bindings.create(
            () => {
                source.get();
                executions += 1;
            },
            () => assert.fail("Disposed render work cannot terminalize."),
        );
        assert.ok(binding);

        runtime.batch(() => {
            source.set(1);
            binding.dispose();
            binding.dispose();
        });

        assert.equal(executions, 1);
        runtime.dispose();
    });

    test("rejects unsupported callbacks and foreign or disposed runtimes", () => {
        const runtime = Runtime.create();
        const bindings = CoreIntegration.createRuntime(runtime);

        assert.throws(
            () => bindings.create(null as unknown as RenderBindingFunctionType, () => undefined),
            /operation must be a function/i,
        );
        assert.throws(
            () => bindings.create(() => undefined, null as unknown as (error: unknown) => void),
            /terminalizer must be a function/i,
        );
        assert.throws(
            () => CoreIntegration.createRuntime({} as ReactiveRuntime),
            /genuine Lilium reactive runtime/i,
        );

        runtime.dispose();
        assert.throws(() => CoreIntegration.createRuntime(runtime), /disposed reactive runtime/i);
    });

    test("terminalizes a non-void runtime callback result", () => {
        const runtime = Runtime.create();
        const bindings = CoreIntegration.createRuntime(runtime);
        let terminalError: unknown;
        const invalidOperation = (() => 1) as unknown as RenderBindingFunctionType;

        assert.throws(
            () =>
                bindings.create(invalidOperation, (error) => {
                    terminalError = error;
                }),
            /must return undefined/i,
        );
        assert.ok(terminalError instanceof TypeError);
        runtime.dispose();
    });
});
