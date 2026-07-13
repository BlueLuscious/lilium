import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { TestReactiveConsumer, TestReactiveRuntime } from "./reactive-runtime.fixture.js";

describe("computed runtime", () => {
    test("evaluates lazily and memoizes until invalidated", () => {
        const runtime = new TestReactiveRuntime();
        const source = runtime.signal(2);
        let evaluations = 0;
        const computed = runtime.computed(() => {
            evaluations += 1;
            return source.get() * 2;
        });

        assert.equal(evaluations, 0);
        assert.equal(computed.get(), 4);
        assert.equal(computed.get(), 4);
        assert.equal(evaluations, 1);

        source.set(3);
        source.set(4);
        assert.equal(evaluations, 1);
        assert.equal(computed.get(), 8);
        assert.equal(evaluations, 2);
    });

    test("replaces dynamic dependencies after successful reevaluation", () => {
        const runtime = new TestReactiveRuntime();
        const selectFirst = runtime.signal(true);
        const first = runtime.signal(1);
        const second = runtime.signal(10);
        let evaluations = 0;
        const computed = runtime.computed(() => {
            evaluations += 1;
            return selectFirst.get() ? first.get() : second.get();
        });

        assert.equal(computed.get(), 1);
        selectFirst.set(false);
        assert.equal(computed.get(), 10);

        first.set(2);
        assert.equal(computed.get(), 10);
        assert.equal(evaluations, 2);

        second.set(11);
        assert.equal(computed.get(), 11);
        assert.equal(evaluations, 3);
    });

    test("participates as both consumer and source in computed chains", () => {
        const runtime = new TestReactiveRuntime();
        const source = runtime.signal(1);
        const doubled = runtime.computed(() => source.get() * 2);
        const formatted = runtime.computed(() => `value:${doubled.get()}`);
        const consumer = new TestReactiveConsumer(runtime);

        assert.equal(
            runtime.tracker.collect(consumer.identity, () => formatted.get()),
            "value:2",
        );

        source.set(2);
        assert.equal(consumer.invalidations, 1);
        assert.equal(formatted.get(), "value:4");
    });

    test("preserves cached identity when reevaluation returns an equal value", () => {
        const runtime = new TestReactiveRuntime();
        const source = runtime.signal(0);
        const stable = { id: "stable" };
        const computed = runtime.computed(() => {
            source.get();
            return stable;
        });

        const initial = computed.get();
        source.set(1);
        const reevaluated = computed.get();

        assert.equal(initial, stable);
        assert.equal(reevaluated, initial);
    });

    test("retains stale state and retries after a failed evaluation", () => {
        const runtime = new TestReactiveRuntime();
        const source = runtime.signal(1);
        const failure = new Error("computed failed");
        let fail = false;
        let evaluations = 0;
        const computed = runtime.computed(() => {
            evaluations += 1;
            const value = source.get();

            if (fail) {
                throw failure;
            }

            return value;
        });

        assert.equal(computed.get(), 1);
        fail = true;
        source.set(2);
        assert.throws(() => computed.get(), (error) => error === failure);

        fail = false;
        assert.equal(computed.get(), 2);
        assert.equal(evaluations, 3);
    });

    test("throws on direct and indirect recursive evaluation", () => {
        const runtime = new TestReactiveRuntime();
        let direct!: ReturnType<typeof runtime.computed<number>>;
        direct = runtime.computed(() => direct.get());

        assert.throws(() => direct.get(), /recursively evaluate/);

        let first!: ReturnType<typeof runtime.computed<number>>;
        let second!: ReturnType<typeof runtime.computed<number>>;
        first = runtime.computed(() => second.get());
        second = runtime.computed(() => first.get());

        assert.throws(() => first.get(), /recursively evaluate/);
    });

    test("rejects tracked cross-runtime computed reads", () => {
        const first = new TestReactiveRuntime();
        const second = new TestReactiveRuntime();
        const consumer = new TestReactiveConsumer(first);
        let evaluations = 0;
        const foreignComputed = second.computed(() => {
            evaluations += 1;
            return 1;
        });

        assert.throws(
            () => first.tracker.collect(
                consumer.identity,
                () => foreignComputed.get(),
            ),
            /across runtimes/,
        );
        assert.equal(evaluations, 0);
    });

    test("disconnects both graph roles and closes with its owner", () => {
        const runtime = new TestReactiveRuntime();
        const source = runtime.signal(1);
        const scope = runtime.ownership.scope();
        const downstream = new TestReactiveConsumer(runtime);
        let computed!: ReturnType<typeof runtime.computed<number>>;

        scope.run(() => {
            computed = runtime.computed(() => source.get() * 2);
        });
        runtime.tracker.collect(downstream.identity, () => computed.get());

        scope.dispose();
        runtime.tracker.invalidate(computed);
        source.set(2);

        assert.equal(downstream.invalidations, 0);
        assert.throws(() => computed.get(), /disposed computed/);
    });
});
