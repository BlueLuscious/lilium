import assert from "node:assert/strict";
import test from "node:test";
import * as component from "@lilium/component";
import * as integration from "@lilium/component/integration";
import { Runtime } from "@lilium/core";

const { Component } = component;

test("the package root exposes only the immutable Component API value", () => {
    assert.deepEqual(Object.keys(component), ["Component"]);
    assert.equal(Object.isFrozen(Component), true);
    assert.throws(() => {
        Component.define = () => undefined;
    }, TypeError);
});

test("the integration subpath is supported without enlarging the package root", () => {
    assert.deepEqual(Object.keys(integration), []);
    assert.equal("ComponentIntegration" in component, false);
});

test("the compiled public API creates definitions, runtimes, and protected instances", () => {
    const definition = Component.define({
        setup(_context, inputs) {
            return { value: () => inputs.value.get() };
        },
        ignored: true,
    });
    const runtime = Runtime.create();
    const owner = runtime.scope();
    const components = Component.createRuntime(runtime);
    const instance = components.create(definition, {
        inputs: { value: 7 },
        owner,
    });

    assert.deepEqual(Object.keys(definition), ["setup"]);
    assert.equal(Object.isFrozen(definition), true);
    assert.equal(Object.isFrozen(components), true);
    assert.ok(instance);
    assert.equal(Object.isFrozen(instance), true);
    assert.equal(instance.controller.value(), 7);
    assert.equal("updateInputs" in instance, false);
    assert.equal("dispose" in components, false);

    instance.dispose();
    assert.equal(instance.disposed, true);
    assert.equal(runtime.signal(1).get(), 1);
    runtime.dispose();
});

test("the package exports map rejects internal implementation subpaths", async () => {
    await assert.rejects(
        import("@lilium/component/runtime/component.engine.js"),
        (error) => error?.code === "ERR_PACKAGE_PATH_NOT_EXPORTED",
    );
});
