import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { type ReactiveRuntime, Runtime } from "@lilium/core";
import { Component } from "../../../src/index.js";

type ExampleInputsType = {
    value: number;
};

type ExampleControllerType = {
    value(): number;
};

describe("component public API", () => {
    it("normalizes definitions without freezing or retaining caller-owned objects", () => {
        const setup = () => ({ value: () => 1 });
        const source = { setup, metadata: "caller-owned" };

        const definition = Component.define<ExampleInputsType, ExampleControllerType>(source);

        assert.notEqual(definition, source);
        assert.deepEqual(Object.keys(definition), ["setup"]);
        assert.equal(definition.setup, setup);
        assert.equal(Object.isFrozen(definition), true);
        assert.equal(Object.isFrozen(source), false);
        assert.throws(() => {
            (definition as { setup: typeof setup }).setup = () => ({ value: () => 2 });
        }, TypeError);
    });

    it("creates a frozen runtime without allocating scopes or taking runtime ownership", () => {
        let scopeCalls = 0;
        const runtime = {
            scope() {
                scopeCalls += 1;
                throw new Error("A component runtime must not create a scope eagerly.");
            },
        } as unknown as ReactiveRuntime;

        const components = Component.createRuntime(runtime);

        assert.equal(scopeCalls, 0);
        assert.equal(Object.isFrozen(components), true);
        assert.equal("dispose" in components, false);
        assert.equal(Object.isFrozen(Component), true);
        assert.throws(() => {
            (Component as unknown as { define: () => undefined }).define = () => undefined;
        }, TypeError);
    });

    it("reuses definitions while exposing no internal instance update capability", () => {
        const definition = Component.define<ExampleInputsType, ExampleControllerType>({
            setup(_context, inputs) {
                return {
                    value: () => inputs.value.get(),
                };
            },
        });
        const firstRuntime = Runtime.create();
        const secondRuntime = Runtime.create();
        const firstOwner = firstRuntime.scope();
        const secondOwner = secondRuntime.scope();
        const firstComponents = Component.createRuntime(firstRuntime);
        const secondComponents = Component.createRuntime(secondRuntime);

        const first = firstComponents.create(definition, {
            inputs: { value: 1 },
            owner: firstOwner,
        });
        const second = secondComponents.create(definition, {
            inputs: { value: 2 },
            owner: secondOwner,
        });

        assert.ok(first);
        assert.ok(second);
        assert.equal(first.controller.value(), 1);
        assert.equal(second.controller.value(), 2);
        assert.equal(Object.isFrozen(first), true);
        assert.equal(Object.isFrozen(second), true);
        assert.equal("updateInputs" in first, false);
        assert.equal("updateInputs" in second, false);

        firstOwner.dispose();
        assert.equal(first.disposed, true);
        assert.equal(second.disposed, false);

        second.dispose();
        assert.equal(second.disposed, true);
        assert.equal(secondRuntime.signal(3).get(), 3);
        firstRuntime.dispose();
        secondRuntime.dispose();
    });

    it("rejects invalid definition shapes before runtime creation", () => {
        assert.throws(
            () => Component.define(null as unknown as Parameters<(typeof Component)["define"]>[0]),
            /non-array object/,
        );
        assert.throws(
            () => Component.define([] as unknown as Parameters<(typeof Component)["define"]>[0]),
            /non-array object/,
        );
        assert.throws(
            () =>
                Component.define({
                    setup: undefined,
                } as unknown as Parameters<(typeof Component)["define"]>[0]),
            /synchronous setup function/,
        );
    });
});
