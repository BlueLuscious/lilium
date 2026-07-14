import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Runtime } from "@lilium/core";
import type { ComponentDefinition } from "../../../src/component/contracts/component-definition.contract.js";
import type { ComponentInputValuesType } from "../../../src/inputs/types/component-input-values.type.js";
import { componentEngine } from "../../../src/runtime/component.engine.js";

type ExampleInputsType = {
    count: number;
    label?: string;
};

type ExampleControllerType = {
    value(): number;
};

const inputs: ComponentInputValuesType<ExampleInputsType> = {
    count: 1,
    label: undefined,
};

describe("component engine", () => {
    it("creates one initialized lifecycle after synchronous owned setup", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        const controller = Object.freeze({ value: () => 1 });
        let cleanupCount = 0;
        let setupCount = 0;
        const definition: ComponentDefinition<ExampleInputsType, ExampleControllerType> = {
            setup(context, setupInputs) {
                setupCount += 1;
                assert.equal(context.runtime, runtime);
                assert.equal(setupInputs.count.get(), 1);
                assert.equal(setupInputs.label.get(), undefined);
                assert.equal("set" in setupInputs.count, false);
                context.scope.cleanup(() => {
                    cleanupCount += 1;
                    return undefined;
                });
                return controller;
            },
        };

        const lifecycle = componentEngine.create(runtime, definition, { inputs, owner });

        assert.ok(lifecycle);
        assert.equal(setupCount, 1);
        assert.equal(lifecycle.controller, controller);
        assert.equal(lifecycle.inputs.count.get(), 1);
        assert.equal(lifecycle.disposed, false);

        lifecycle.updateInputs({ count: 2, label: "next" });
        assert.equal(lifecycle.inputs.count.get(), 2);
        assert.equal(lifecycle.inputs.label.get(), "next");

        lifecycle.dispose();
        assert.equal(lifecycle.disposed, true);
        assert.equal(cleanupCount, 1);
        runtime.dispose();
    });

    it("returns undefined and disposes incomplete ownership after a handled setup failure", () => {
        const runtime = Runtime.create();
        const root = runtime.scope();
        const setupError = new Error("handled setup failure");
        let cleanupCount = 0;
        let handledError: unknown;
        const owner = root.boundary((event) => {
            handledError = event.error;
            return "handled";
        });
        const definition: ComponentDefinition<ExampleInputsType, ExampleControllerType> = {
            setup(context) {
                context.scope.cleanup(() => {
                    cleanupCount += 1;
                    return undefined;
                });
                throw setupError;
            },
        };

        const lifecycle = componentEngine.create(runtime, definition, { inputs, owner });

        assert.equal(lifecycle, undefined);
        assert.equal(handledError, setupError);
        assert.equal(cleanupCount, 1);
        runtime.dispose();
    });

    it("preserves one propagated setup failure and disposes incomplete ownership", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        const setupError = new Error("propagated setup failure");
        let cleanupCount = 0;
        const definition: ComponentDefinition<ExampleInputsType, ExampleControllerType> = {
            setup(context) {
                context.scope.cleanup(() => {
                    cleanupCount += 1;
                    return undefined;
                });
                throw setupError;
            },
        };

        assert.throws(
            () => componentEngine.create(runtime, definition, { inputs, owner }),
            (error) => error === setupError,
        );
        assert.equal(cleanupCount, 1);
        runtime.dispose();
    });

    it("combines propagated creation and incomplete disposal failures", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        const setupError = new Error("setup failed");
        const disposalError = new Error("disposal failed");
        const definition: ComponentDefinition<ExampleInputsType, ExampleControllerType> = {
            setup(context) {
                context.scope.cleanup(() => {
                    throw disposalError;
                });
                throw setupError;
            },
        };

        assert.throws(
            () => componentEngine.create(runtime, definition, { inputs, owner }),
            (error) => {
                assert.ok(error instanceof AggregateError);
                assert.deepEqual(error.errors, [setupError, disposalError]);
                return true;
            },
        );
        runtime.dispose();
    });

    it("rejects a foreign owner before setup executes", () => {
        const runtime = Runtime.create();
        const foreignRuntime = Runtime.create();
        const owner = foreignRuntime.scope();
        let setupCount = 0;
        const definition: ComponentDefinition<ExampleInputsType, ExampleControllerType> = {
            setup() {
                setupCount += 1;
                return { value: () => 1 };
            },
        };

        assert.throws(
            () => componentEngine.create(runtime, definition, { inputs, owner }),
            /does not belong to this runtime owner/,
        );
        assert.equal(setupCount, 0);
        runtime.dispose();
        foreignRuntime.dispose();
    });

    it("rejects unsupported runtime shapes without exposing a partial lifecycle", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        let cleanupCount = 0;
        const asynchronousDefinition = {
            setup(context: { scope: { cleanup(cleanup: () => undefined): void } }) {
                context.scope.cleanup(() => {
                    cleanupCount += 1;
                    return undefined;
                });
                return Promise.resolve({ value: () => 1 });
            },
        } as unknown as ComponentDefinition<ExampleInputsType, ExampleControllerType>;

        assert.throws(
            () => componentEngine.create(runtime, asynchronousDefinition, { inputs, owner }),
            /not a Promise-like object/,
        );
        assert.equal(cleanupCount, 1);
        assert.throws(
            () =>
                componentEngine.create(
                    runtime,
                    { setup: undefined } as unknown as ComponentDefinition<
                        ExampleInputsType,
                        ExampleControllerType
                    >,
                    { inputs, owner },
                ),
            /synchronous setup function/,
        );
        assert.throws(
            () =>
                componentEngine.create(runtime, asynchronousDefinition, {
                    inputs: [] as unknown as ComponentInputValuesType<ExampleInputsType>,
                    owner,
                }),
            /normalized non-array object snapshot/,
        );

        runtime.dispose();
    });
});
