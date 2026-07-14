import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Runtime } from "@lilium/core";
import { Component, type ComponentInstance } from "../../../src/index.js";

type ExampleInputsType = {
    value: number;
};

type ExampleControllerType = {
    value(): number;
};

describe("component lifecycle integration", () => {
    it("disposes nested component ownership in one deterministic LIFO order", () => {
        const runtime = Runtime.create();
        const root = runtime.scope();
        const owner = root.child();
        const components = Component.createRuntime(runtime);
        const events: string[] = [];
        let instance: ComponentInstance<ExampleInputsType, ExampleControllerType> | undefined;

        owner.cleanup(() => {
            events.push("owner:first");
            return undefined;
        });

        const definition = Component.define<ExampleInputsType, ExampleControllerType>({
            setup(context, inputs) {
                events.push("setup");
                assert.notEqual(context.scope, owner);

                context.scope.cleanup(() => {
                    events.push(`component:${instance?.disposed}`);
                    return undefined;
                });

                const nested = context.scope.child();
                nested.cleanup(() => {
                    events.push("nested");
                    return undefined;
                });

                return {
                    value: () => inputs.value.get(),
                };
            },
        });

        instance = components.create(definition, {
            inputs: { value: 1 },
            owner,
        });

        owner.cleanup(() => {
            events.push("owner:last");
            return undefined;
        });

        assert.ok(instance);
        assert.deepEqual(events, ["setup"]);

        root.dispose();
        instance.dispose();

        assert.equal(instance.disposed, true);
        assert.deepEqual(events, [
            "setup",
            "owner:last",
            "nested",
            "component:true",
            "owner:first",
        ]);
        runtime.dispose();
    });

    it("routes setup failures through nested boundaries before aborting creation", () => {
        const runtime = Runtime.create();
        const root = runtime.scope();
        const setupError = new Error("setup failed");
        const events: string[] = [];
        const outer = root.boundary((event) => {
            events.push("outer");
            assert.equal(event.error, setupError);
            return "handled";
        });
        const inner = outer.boundary((event) => {
            events.push("inner");
            assert.equal(event.error, setupError);
            return "propagate";
        });
        const owner = inner.child();
        const components = Component.createRuntime(runtime);
        const definition = Component.define<ExampleInputsType, ExampleControllerType>({
            setup(context) {
                events.push("setup");
                context.scope.cleanup(() => {
                    events.push("cleanup");
                    return undefined;
                });
                throw setupError;
            },
        });

        const instance = components.create(definition, {
            inputs: { value: 1 },
            owner,
        });

        assert.equal(instance, undefined);
        assert.deepEqual(events, ["setup", "inner", "outer", "cleanup"]);
        runtime.dispose();
    });

    it("handles public disposal failures once and leaves the instance disposed", () => {
        const runtime = Runtime.create();
        const root = runtime.scope();
        const cleanupError = new Error("cleanup failed");
        let handledCount = 0;
        let instanceDisposedDuringRecovery = false;
        let instance: ComponentInstance<ExampleInputsType, ExampleControllerType> | undefined;
        const owner = root.boundary((event) => {
            handledCount += 1;
            assert.equal(event.error, cleanupError);
            instanceDisposedDuringRecovery = instance?.disposed ?? false;
            return "handled";
        });
        const components = Component.createRuntime(runtime);
        const definition = Component.define<ExampleInputsType, ExampleControllerType>({
            setup(context, inputs) {
                context.scope.cleanup(() => {
                    throw cleanupError;
                });
                return {
                    value: () => inputs.value.get(),
                };
            },
        });

        instance = components.create(definition, {
            inputs: { value: 1 },
            owner,
        });

        assert.ok(instance);
        assert.doesNotThrow(() => instance?.dispose());
        assert.doesNotThrow(() => instance?.dispose());
        assert.equal(instance.disposed, true);
        assert.equal(instanceDisposedDuringRecovery, true);
        assert.equal(handledCount, 1);
        runtime.dispose();
    });

    it("rejects active-scope disposal and creation beneath a disposed owner", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        const components = Component.createRuntime(runtime);
        let cleanupCount = 0;
        let setupCount = 0;
        const invalidSetup = Component.define<ExampleInputsType, ExampleControllerType>({
            setup(context) {
                setupCount += 1;
                context.scope.cleanup(() => {
                    cleanupCount += 1;
                    return undefined;
                });
                context.scope.dispose();
                return { value: () => 1 };
            },
        });

        assert.throws(
            () =>
                components.create(invalidSetup, {
                    inputs: { value: 1 },
                    owner,
                }),
            /active scope/,
        );
        assert.equal(setupCount, 1);
        assert.equal(cleanupCount, 1);

        owner.dispose();

        assert.throws(
            () =>
                components.create(invalidSetup, {
                    inputs: { value: 1 },
                    owner,
                }),
            /disposed scope/,
        );
        assert.equal(setupCount, 1);
        assert.equal(cleanupCount, 1);
        runtime.dispose();
    });
});
