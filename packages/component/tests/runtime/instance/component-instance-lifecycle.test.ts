import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { type ReactiveRuntime, Runtime, type Scope } from "@lilium/core";
import { ComponentInputStore } from "../../../src/inputs/runtime/component-input.store.js";
import type { ComponentInputValuesType } from "../../../src/inputs/types/component-input-values.type.js";
import { ComponentInstanceLifecycle } from "../../../src/instance/runtime/component-instance-lifecycle.js";

type ExampleInputsType = {
    count: number;
    label?: string;
};

type ExampleControllerType = {
    reset(): void;
};

const initialInputs: ComponentInputValuesType<ExampleInputsType> = {
    count: 1,
    label: "initial",
};

const createInputStore = (
    runtime: ReactiveRuntime,
    scope: Scope,
    values: ComponentInputValuesType<ExampleInputsType> = initialInputs,
): ComponentInputStore<ExampleInputsType> => {
    let store: ComponentInputStore<ExampleInputsType> | undefined;

    scope.run(() => {
        store = new ComponentInputStore(runtime, values);
        return undefined;
    });

    assert.ok(store);
    return store;
};

const createLifecycle = (
    scope: Scope,
    store: ComponentInputStore<ExampleInputsType>,
): ComponentInstanceLifecycle<ExampleInputsType, ExampleControllerType> =>
    new ComponentInstanceLifecycle(scope, Object.freeze({ reset() {} }), store);

describe("component instance lifecycle", () => {
    it("keeps stable runtime-read-only inputs and batches complete updates", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        const scope = runtime.scope(owner);
        let store: ComponentInputStore<ExampleInputsType> | undefined;
        const observations: Array<readonly [number, string | undefined]> = [];

        scope.run(() => {
            store = new ComponentInputStore(runtime, initialInputs);
            runtime.effect(() => {
                assert.ok(store);
                observations.push([store.inputs.count.get(), store.inputs.label.get()]);
                return undefined;
            });
            return undefined;
        });

        assert.ok(store);
        const inputs = store.inputs;
        const count = inputs.count;
        const label = inputs.label;
        const lifecycle = createLifecycle(scope, store);

        assert.equal(lifecycle.inputs, inputs);
        assert.equal(Object.isFrozen(lifecycle), true);
        assert.equal(Object.isFrozen(inputs), true);
        assert.equal(Object.isFrozen(count), true);
        assert.equal("set" in count, false);
        assert.equal("update" in count, false);
        assert.deepEqual(observations, [[1, "initial"]]);

        lifecycle.updateInputs({ count: 2, label: undefined });

        assert.equal(lifecycle.inputs.count, count);
        assert.equal(lifecycle.inputs.label, label);
        assert.equal(count.get(), 2);
        assert.equal(label.get(), undefined);
        assert.deepEqual(observations, [
            [1, "initial"],
            [2, undefined],
        ]);

        lifecycle.updateInputs({ count: 3, label: "restored" });

        assert.equal(lifecycle.inputs.count, count);
        assert.equal(lifecycle.inputs.label, label);
        assert.deepEqual(observations, [
            [1, "initial"],
            [2, undefined],
            [3, "restored"],
        ]);

        lifecycle.dispose();
        runtime.dispose();
    });

    it("captures a complete snapshot before applying any input write", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        const scope = runtime.scope(owner);
        const store = createInputStore(runtime, scope);
        const lifecycle = createLifecycle(scope, store);
        const snapshotError = new Error("snapshot failed");
        const snapshot = Object.defineProperties(
            {},
            {
                count: {
                    enumerable: true,
                    value: 2,
                },
                label: {
                    enumerable: true,
                    get: () => {
                        throw snapshotError;
                    },
                },
            },
        ) as ComponentInputValuesType<ExampleInputsType>;

        assert.throws(() => lifecycle.updateInputs(snapshot), snapshotError);
        assert.equal(lifecycle.inputs.count.get(), 1);
        assert.equal(lifecycle.inputs.label.get(), "initial");

        lifecycle.dispose();
        runtime.dispose();
    });

    it("rejects incomplete and extended snapshots before changing input values", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        const scope = runtime.scope(owner);
        const store = createInputStore(runtime, scope);
        const lifecycle = createLifecycle(scope, store);

        assert.throws(
            () =>
                lifecycle.updateInputs({ count: 2 } as ComponentInputValuesType<ExampleInputsType>),
            TypeError,
        );
        assert.throws(
            () =>
                lifecycle.updateInputs({
                    count: 2,
                    label: "next",
                    extra: true,
                } as ComponentInputValuesType<ExampleInputsType>),
            TypeError,
        );
        assert.equal(lifecycle.inputs.count.get(), 1);
        assert.equal(lifecycle.inputs.label.get(), "initial");

        lifecycle.dispose();
        runtime.dispose();
    });

    it("disposes explicitly once and rejects later updates", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        const scope = runtime.scope(owner);
        const store = createInputStore(runtime, scope);
        let cleanupCount = 0;

        scope.cleanup(() => {
            cleanupCount += 1;
            return undefined;
        });

        const lifecycle = createLifecycle(scope, store);
        assert.equal(lifecycle.disposed, false);

        lifecycle.dispose();
        lifecycle.dispose();

        assert.equal(lifecycle.disposed, true);
        assert.equal(cleanupCount, 1);
        assert.throws(
            () => lifecycle.updateInputs({ count: 2, label: undefined }),
            /disposed component instance/,
        );
        assert.throws(() => lifecycle.inputs.count.get(), /disposed signal/);

        runtime.dispose();
    });

    it("observes disposal inherited from the parent ownership scope", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        const scope = runtime.scope(owner);
        const store = createInputStore(runtime, scope);
        const lifecycle = createLifecycle(scope, store);

        owner.dispose();

        assert.equal(lifecycle.disposed, true);
        assert.doesNotThrow(() => lifecycle.dispose());
        assert.throws(
            () => lifecycle.updateInputs({ count: 2, label: undefined }),
            /disposed component instance/,
        );

        runtime.dispose();
    });

    it("creates one attachment after setup and disposes it before component resources", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        const scope = runtime.scope(owner);
        const store = createInputStore(runtime, scope);
        const order: string[] = [];

        scope.cleanup(() => {
            order.push("setup");
        });
        const lifecycle = createLifecycle(scope, store);
        const attachment = lifecycle.createAttachment();
        attachment.cleanup(() => {
            order.push("attachment");
        });

        assert.throws(() => lifecycle.createAttachment(), /already has an attachment/i);
        lifecycle.dispose();

        assert.deepEqual(order, ["attachment", "setup"]);
        assert.throws(() => attachment.run(() => undefined), /disposed scope/i);
        assert.throws(() => lifecycle.createAttachment(), /disposed component instance/i);
        runtime.dispose();
    });
});
