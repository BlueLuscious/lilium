import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { ReactiveRuntime } from "@lilium/core";
import { Runtime } from "@lilium/core";
import { Component } from "../../../src/index.js";
import { ComponentIntegration } from "../../../src/integration/index.js";

describe("component occurrence integration", () => {
    test("creates one stable public instance and batches complete input snapshots", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        const observations: Array<readonly [number, string | undefined]> = [];
        let setups = 0;
        const definition = Component.define({
            setup(
                context,
                inputs: { count: { get(): number }; label: { get(): string | undefined } },
            ) {
                setups += 1;
                context.runtime.effect(() => {
                    observations.push([inputs.count.get(), inputs.label.get()]);
                });
                return { count: () => inputs.count.get() };
            },
        });
        const occurrences = ComponentIntegration.createRuntime(runtime);
        const occurrence = occurrences.create(definition, {
            inputs: { count: 1, label: undefined },
            owner,
        });
        assert.ok(occurrence);
        const instance = occurrence.instance;
        const controller = instance.controller;

        occurrence.updateInputs({ count: 1, label: undefined });
        occurrence.updateInputs({ count: 2, label: "next" });

        assert.equal(setups, 1);
        assert.equal(occurrence.instance, instance);
        assert.equal(occurrence.instance.controller, controller);
        assert.equal(controller.count(), 2);
        assert.deepEqual(observations, [
            [1, undefined],
            [2, "next"],
        ]);
        occurrence.dispose();
        runtime.dispose();
    });

    test("owns attachment resources beneath the private component scope", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        const order: string[] = [];
        const definition = Component.define({
            setup(context) {
                context.scope.cleanup(() => {
                    order.push("setup");
                });
                return {};
            },
        });
        const occurrence = ComponentIntegration.createRuntime(runtime).create(definition, {
            inputs: {},
            owner,
        });
        assert.ok(occurrence);
        let attachedSignal: ReturnType<typeof runtime.signal> | undefined;

        occurrence.attachment.run(() => {
            attachedSignal = runtime.signal(1);
            occurrence.attachment.cleanup(() => {
                order.push("attachment");
            });
        });

        occurrence.dispose();
        occurrence.dispose();

        assert.deepEqual(order, ["attachment", "setup"]);
        assert.equal(occurrence.instance.disposed, true);
        const disposedSignal = attachedSignal;
        assert.ok(disposedSignal);
        assert.throws(() => disposedSignal.get(), /disposed signal/i);
        runtime.dispose();
    });

    test("returns no occurrence after a handled setup failure", () => {
        const runtime = Runtime.create();
        const root = runtime.scope();
        const setupFailure = new Error("setup failed");
        let handledError: unknown;
        let cleanups = 0;
        const owner = root.boundary((event) => {
            handledError = event.error;
            return "handled";
        });
        const definition = Component.define({
            setup(context) {
                context.scope.cleanup(() => {
                    cleanups += 1;
                });
                throw setupFailure;
            },
        });

        const occurrence = ComponentIntegration.createRuntime(runtime).create(definition, {
            inputs: {},
            owner,
        });

        assert.equal(occurrence, undefined);
        assert.equal(handledError, setupFailure);
        assert.equal(cleanups, 1);
        runtime.dispose();
    });

    test("inherits parent disposal and rejects later input updates", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        const definition = Component.define({
            setup(_context, inputs: { value: { get(): number } }) {
                return { value: () => inputs.value.get() };
            },
        });
        const occurrence = ComponentIntegration.createRuntime(runtime).create(definition, {
            inputs: { value: 1 },
            owner,
        });
        assert.ok(occurrence);

        owner.dispose();

        assert.equal(occurrence.instance.disposed, true);
        assert.doesNotThrow(() => occurrence.dispose());
        assert.throws(() => occurrence.updateInputs({ value: 2 }), /disposed component instance/i);
        runtime.dispose();
    });

    test("reuses one definition across independently replaceable occurrences", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        let setups = 0;
        const definition = Component.define({
            setup() {
                setups += 1;
                return {};
            },
        });
        const occurrences = ComponentIntegration.createRuntime(runtime);
        const first = occurrences.create(definition, { inputs: {}, owner });
        assert.ok(first);
        first.dispose();
        const second = occurrences.create(definition, { inputs: {}, owner });
        assert.ok(second);

        assert.notEqual(first, second);
        assert.notEqual(first.attachment, second.attachment);
        assert.equal(setups, 2);
        assert.equal(Object.isFrozen(definition), true);
        assert.throws(() => first.attachment.run(() => undefined), /disposed scope/i);
        assert.doesNotThrow(() => second.attachment.run(() => undefined));
        second.dispose();
        runtime.dispose();
    });

    test("attempts attachment and setup cleanup failures in deterministic order", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        const attachmentFailure = new Error("attachment cleanup failed");
        const setupFailure = new Error("setup cleanup failed");
        const definition = Component.define({
            setup(context) {
                context.scope.cleanup(() => {
                    throw setupFailure;
                });
                return {};
            },
        });
        const occurrence = ComponentIntegration.createRuntime(runtime).create(definition, {
            inputs: {},
            owner,
        });
        assert.ok(occurrence);
        occurrence.attachment.cleanup(() => {
            throw attachmentFailure;
        });

        assert.throws(
            () => occurrence.dispose(),
            (error) => {
                assert.ok(error instanceof AggregateError);
                assert.deepEqual(error.errors, [attachmentFailure, setupFailure]);
                return true;
            },
        );
        assert.equal(occurrence.instance.disposed, true);
        assert.doesNotThrow(() => occurrence.dispose());
        runtime.dispose();
    });

    test("rejects foreign and disposed Core runtimes before retaining them", () => {
        const runtime = Runtime.create();

        assert.throws(
            () => ComponentIntegration.createRuntime({} as ReactiveRuntime),
            /genuine Lilium reactive runtime/i,
        );
        runtime.dispose();
        assert.throws(
            () => ComponentIntegration.createRuntime(runtime),
            /disposed reactive runtime/i,
        );
    });
});
