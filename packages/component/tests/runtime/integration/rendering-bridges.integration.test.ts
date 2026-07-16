import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { ReadonlySignal } from "@lilium/core";
import { Runtime } from "@lilium/core";
import { CoreIntegration } from "@lilium/core/integration";
import { Component } from "../../../src/index.js";
import type { ComponentOccurrence } from "../../../src/integration/index.js";
import { ComponentIntegration } from "../../../src/integration/index.js";

describe("rendering integration bridges", () => {
    test("renders one complete occurrence update before eligible component effects", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        const order: string[] = [];
        const definition = Component.define({
            setup(context, inputs: { value: ReadonlySignal<number> }) {
                context.runtime.effect(() => {
                    order.push(`effect:${inputs.value.get()}`);
                });

                return { value: () => inputs.value.get() };
            },
        });
        const occurrence = ComponentIntegration.createRuntime(runtime).create(definition, {
            inputs: { value: 1 },
            owner,
        });
        assert.ok(occurrence);
        const instance = occurrence.instance;
        const controller = instance.controller;
        const bindings = CoreIntegration.createRuntime(runtime);

        occurrence.attachment.run(() => {
            const binding = bindings.create(
                () => {
                    order.push(`render:${controller.value()}`);
                },
                () => assert.fail("Successful bridge composition cannot terminalize."),
            );
            assert.ok(binding);
        });
        order.length = 0;

        occurrence.updateInputs({ value: 2 });

        assert.deepEqual(order, ["render:2", "effect:2"]);
        assert.equal(occurrence.instance, instance);
        assert.equal(occurrence.instance.controller, controller);
        occurrence.dispose();
        runtime.dispose();
    });

    test("terminalizes binding work before attachment, occurrence, and owner cleanup", () => {
        const runtime = Runtime.create();
        const root = runtime.scope();
        const trigger = runtime.signal(0);
        const failure = new Error("render bridge failed");
        const order: string[] = [];
        let occurrence: ComponentOccurrence<object, object> | undefined;

        root.cleanup(() => {
            order.push("owner");
        });
        const owner = root.boundary((event) => {
            assert.equal(event.error, failure);
            order.push("boundary");
            return "handled";
        });
        const definition = Component.define({
            setup(context) {
                context.scope.cleanup(() => {
                    order.push(`component:${String(occurrence?.instance.disposed)}`);
                });
                return {};
            },
        });
        occurrence = ComponentIntegration.createRuntime(runtime).create(definition, {
            inputs: {},
            owner,
        });
        assert.ok(occurrence);
        const activeOccurrence = occurrence;

        activeOccurrence.attachment.cleanup(() => {
            order.push(`attachment:${String(activeOccurrence.instance.disposed)}`);
        });
        activeOccurrence.attachment.run(() => {
            const binding = CoreIntegration.createRuntime(runtime).create(
                () => {
                    if (trigger.get() > 0) {
                        throw failure;
                    }
                },
                (error) => {
                    assert.equal(error, failure);
                    order.push("binding");
                    activeOccurrence.dispose();
                    order.push(`occurrence:${String(activeOccurrence.instance.disposed)}`);
                },
            );
            assert.ok(binding);
        });

        trigger.set(1);
        trigger.set(2);
        activeOccurrence.dispose();
        root.dispose();

        assert.deepEqual(order, [
            "binding",
            "attachment:false",
            "component:true",
            "occurrence:true",
            "boundary",
            "owner",
        ]);
        runtime.dispose();
    });
});
