import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { TestReactiveConsumer, TestReactiveRuntime } from "./reactive-runtime.fixture.js";

describe("signal runtime", () => {
    test("tracks reads and invalidates only accepted writes", () => {
        const runtime = new TestReactiveRuntime();
        const signal = runtime.signal(1);
        const consumer = new TestReactiveConsumer(runtime);

        runtime.tracker.collect(consumer.identity, () => signal.get());
        signal.set(1);
        assert.equal(consumer.invalidations, 0);

        signal.set(2);
        assert.equal(signal.get(), 2);
        assert.equal(consumer.invalidations, 1);
    });

    test("preserves the current value for custom equality and equality failures", () => {
        const runtime = new TestReactiveRuntime();
        const initial = { id: 1, label: "initial" };
        const failure = new Error("equality failed");
        const signal = runtime.signal(initial, {
            equals: (current, candidate) => {
                if (candidate.id < 0) {
                    throw failure;
                }

                return current.id === candidate.id;
            },
        });

        signal.set({ id: 1, label: "discarded" });
        assert.equal(signal.get(), initial);

        assert.throws(
            () => signal.set({ id: -1, label: "failure" }),
            (error) => error === failure,
        );
        assert.equal(signal.get(), initial);
    });

    test("updates from the latest value without tracking updater reads", () => {
        const runtime = new TestReactiveRuntime();
        const signal = runtime.signal(1);
        const incidental = runtime.signal(10);
        const consumer = new TestReactiveConsumer(runtime);

        signal.update((value) => value + 1);
        runtime.tracker.collect(consumer.identity, () => {
            signal.update((value) => value + incidental.get());
        });

        assert.equal(signal.get(), 12);
        incidental.set(11);
        assert.equal(consumer.invalidations, 0);
    });

    test("executes custom equality without tracking its reactive reads", () => {
        const runtime = new TestReactiveRuntime();
        const incidental = runtime.signal(false);
        const signal = runtime.signal(1, {
            equals: (current, candidate) => {
                incidental.get();
                return current === candidate;
            },
        });
        const consumer = new TestReactiveConsumer(runtime);

        runtime.tracker.collect(consumer.identity, () => signal.set(2));
        incidental.set(true);

        assert.equal(consumer.invalidations, 0);
        assert.equal(signal.get(), 2);
    });

    test("remains shallow until an explicit object write occurs", () => {
        const runtime = new TestReactiveRuntime();
        const value = { count: 0 };
        const signal = runtime.signal(value);
        const consumer = new TestReactiveConsumer(runtime);

        runtime.tracker.collect(consumer.identity, () => signal.get());
        value.count += 1;
        assert.equal(signal.get().count, 1);
        assert.equal(consumer.invalidations, 0);

        signal.set({ count: 2 });
        assert.equal(consumer.invalidations, 1);
    });

    test("rejects tracked cross-runtime reads", () => {
        const first = new TestReactiveRuntime();
        const second = new TestReactiveRuntime();
        const consumer = new TestReactiveConsumer(first);
        const foreignSignal = second.signal(1);

        assert.throws(
            () => first.tracker.collect(consumer.identity, () => foreignSignal.get()),
            /across runtimes/,
        );
    });

    test("closes and disconnects a signal with its owner", () => {
        const runtime = new TestReactiveRuntime();
        const scope = runtime.ownership.scope();
        const consumer = new TestReactiveConsumer(runtime);
        let signal!: ReturnType<typeof runtime.signal<number>>;

        scope.run(() => {
            signal = runtime.signal(1);
        });
        runtime.tracker.collect(consumer.identity, () => signal.get());

        scope.dispose();
        runtime.tracker.invalidate(signal);

        assert.equal(consumer.invalidations, 0);
        assert.throws(() => signal.get(), /disposed signal/);
        assert.throws(() => signal.set(2), /disposed signal/);
        assert.throws(() => signal.update((value) => value + 1), /disposed signal/);
    });
});
