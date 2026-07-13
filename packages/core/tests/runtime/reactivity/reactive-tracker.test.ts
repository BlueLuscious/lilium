import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { IReactiveConsumer } from "../../../src/reactivity/contracts/internal/tracking/reactive-consumer.contract.js";
import type { IReactiveRuntimeContext } from "../../../src/reactivity/contracts/internal/tracking/reactive-runtime-context.contract.js";
import type { IReactiveSource } from "../../../src/reactivity/contracts/internal/tracking/reactive-source.contract.js";
import { ReactiveTrackerRuntime } from "../../../src/reactivity/runtime/reactive-tracker.runtime.js";
import type { IScheduler } from "../../../src/scheduler/contracts/internal/scheduler/scheduler.contract.js";

class TestRuntime implements IReactiveRuntimeContext {
    declare readonly scheduler: IScheduler;

    readonly tracker = new ReactiveTrackerRuntime();

    requestFlush(): void {}
}

class TestConsumer {
    invalidations = 0;

    constructor(readonly runtime: IReactiveRuntimeContext) {}

    get identity(): IReactiveConsumer {
        return this as unknown as IReactiveConsumer;
    }

    invalidate(): void {
        this.invalidations += 1;
    }
}

class TestSource {
    constructor(readonly runtime: IReactiveRuntimeContext) {}

    get identity(): IReactiveSource {
        return this as unknown as IReactiveSource;
    }

    read(): void {
        this.runtime.tracker.track(this.identity);
    }
}

describe("reactive tracker runtime", () => {
    test("deduplicates reads and replaces stale dynamic dependencies", () => {
        const runtime = new TestRuntime();
        const consumer = new TestConsumer(runtime);
        const first = new TestSource(runtime);
        const second = new TestSource(runtime);

        runtime.tracker.collect(consumer.identity, () => {
            first.read();
            first.read();
        });

        runtime.tracker.invalidate(first.identity);
        assert.equal(consumer.invalidations, 1);

        runtime.tracker.collect(consumer.identity, () => second.read());
        runtime.tracker.invalidate(first.identity);
        assert.equal(consumer.invalidations, 1);
        runtime.tracker.invalidate(second.identity);
        assert.equal(consumer.invalidations, 2);
    });

    test("rolls back failed collection and restores the parent consumer", () => {
        const runtime = new TestRuntime();
        const outer = new TestConsumer(runtime);
        const inner = new TestConsumer(runtime);
        const previousInner = new TestSource(runtime);
        const failedInner = new TestSource(runtime);
        const outerAfterFailure = new TestSource(runtime);
        const failure = new Error("collection failed");

        runtime.tracker.collect(inner.identity, () => previousInner.read());
        runtime.tracker.collect(outer.identity, () => {
            assert.throws(
                () =>
                    runtime.tracker.collect(inner.identity, () => {
                        failedInner.read();
                        throw failure;
                    }),
                (error) => error === failure,
            );
            outerAfterFailure.read();
        });

        runtime.tracker.invalidate(previousInner.identity);
        assert.equal(inner.invalidations, 1);
        runtime.tracker.invalidate(failedInner.identity);
        assert.equal(inner.invalidations, 1);
        runtime.tracker.invalidate(outerAfterFailure.identity);
        assert.equal(outer.invalidations, 1);
    });

    test("suspends tracking temporarily and restores the active consumer", () => {
        const runtime = new TestRuntime();
        const consumer = new TestConsumer(runtime);
        const untracked = new TestSource(runtime);
        const tracked = new TestSource(runtime);

        runtime.tracker.collect(consumer.identity, () => {
            runtime.tracker.untrack(() => untracked.read());
            tracked.read();
        });

        runtime.tracker.invalidate(untracked.identity);
        assert.equal(consumer.invalidations, 0);
        runtime.tracker.invalidate(tracked.identity);
        assert.equal(consumer.invalidations, 1);
    });

    test("rejects cross-runtime reads without changing committed dependencies", () => {
        const firstRuntime = new TestRuntime();
        const secondRuntime = new TestRuntime();
        const consumer = new TestConsumer(firstRuntime);
        const committed = new TestSource(firstRuntime);
        const foreign = new TestSource(secondRuntime);

        firstRuntime.tracker.collect(consumer.identity, () => committed.read());

        assert.throws(
            () => firstRuntime.tracker.collect(consumer.identity, () => foreign.read()),
            /across runtimes/,
        );

        firstRuntime.tracker.invalidate(committed.identity);
        assert.equal(consumer.invalidations, 1);
        secondRuntime.tracker.invalidate(foreign.identity);
        assert.equal(consumer.invalidations, 1);
    });

    test("disconnects every consumer edge idempotently", () => {
        const runtime = new TestRuntime();
        const consumer = new TestConsumer(runtime);
        const first = new TestSource(runtime);
        const second = new TestSource(runtime);

        runtime.tracker.collect(consumer.identity, () => {
            first.read();
            second.read();
        });
        runtime.tracker.disconnect(consumer.identity);
        runtime.tracker.disconnect(consumer.identity);
        runtime.tracker.invalidate(first.identity);
        runtime.tracker.invalidate(second.identity);

        assert.equal(consumer.invalidations, 0);
    });

    test("disconnects a source from consumers with longer lifetimes", () => {
        const runtime = new TestRuntime();
        const consumer = new TestConsumer(runtime);
        const source = new TestSource(runtime);

        runtime.tracker.collect(consumer.identity, () => source.read());
        runtime.tracker.disconnectSource(source.identity);
        runtime.tracker.disconnectSource(source.identity);
        runtime.tracker.invalidate(source.identity);

        assert.equal(consumer.invalidations, 0);
    });
});
