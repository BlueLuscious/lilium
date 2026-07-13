import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Context, Runtime } from "../../../src/index.js";

describe("production reactive runtime composition", () => {
    test("coordinates dynamic computed dependencies and batched effects", () => {
        const runtime = Runtime.create();
        const usePrimary = runtime.signal(true);
        const primary = runtime.signal(1);
        const secondary = runtime.signal(10);
        const selected = runtime.computed(() =>
            usePrimary.get() ? primary.get() : secondary.get(),
        );
        const observed: number[] = [];

        runtime.effect(() => {
            observed.push(selected.get());
            return undefined;
        });

        runtime.batch(() => {
            primary.set(2);
            secondary.set(20);
            return undefined;
        });
        usePrimary.set(false);
        primary.set(3);
        secondary.set(30);

        assert.deepEqual(observed, [1, 2, 20, 30]);
        runtime.dispose();
    });

    test("restores scope ownership for contexts, effects, and boundaries", () => {
        const runtime = Runtime.create();
        const Message = Context.create<string>();
        const root = runtime.scope();
        const boundary = root.boundary(() => "handled");
        const message = runtime.signal("initial");
        const observed: string[] = [];
        let cleanupCount = 0;

        Message.provide(boundary, message.get());
        boundary.run(() => {
            runtime.effect((execution) => {
                execution.cleanup(() => {
                    cleanupCount += 1;
                    return undefined;
                });
                observed.push(Message.get());

                if (message.get() === "failure") {
                    throw new Error("handled effect failure");
                }

                return undefined;
            });
        });

        message.set("failure");
        boundary.dispose();

        assert.deepEqual(observed, ["initial", "initial"]);
        assert.equal(cleanupCount, 2);
        runtime.dispose();
    });

    test("isolates production graphs across runtimes", () => {
        const first = Runtime.create();
        const second = Runtime.create();
        const foreign = first.signal(1);

        assert.throws(
            () =>
                second.effect(() => {
                    foreign.get();
                    return undefined;
                }),
            /across runtimes/i,
        );

        first.dispose();
        second.dispose();
    });

    test("creates children only beneath scopes owned by the same runtime", () => {
        const first = Runtime.create();
        const second = Runtime.create();
        const owner = first.scope();
        const child = first.scope(owner);

        assert.throws(() => second.scope(owner), /runtime owner/i);
        assert.throws(() => first.scope({} as never), /not a Lilium scope/i);
        owner.dispose();
        assert.throws(() => child.run(() => undefined), /disposed/i);
        assert.throws(() => first.scope(owner), /disposed/i);

        first.dispose();
        second.dispose();
    });
});
