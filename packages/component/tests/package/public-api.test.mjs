import assert from "node:assert/strict";
import test from "node:test";
import * as component from "@lilium/component";
import * as integration from "@lilium/component/integration";
import { Runtime } from "@lilium/core";
import { CoreIntegration } from "@lilium/core/integration";

const { Component } = component;

test("the package root exposes only the immutable Component API value", () => {
    assert.deepEqual(Object.keys(component), ["Component"]);
    assert.equal(Object.isFrozen(Component), true);
    assert.throws(() => {
        Component.define = () => undefined;
    }, TypeError);
});

test("the integration subpath is supported without enlarging the package root", () => {
    assert.deepEqual(Object.keys(integration), ["ComponentIntegration"]);
    assert.equal(Object.isFrozen(integration.ComponentIntegration), true);
    assert.equal("ComponentIntegration" in component, false);
});

test("the compiled integration API creates protected component occurrences", () => {
    const definition = Component.define({
        setup(_context, inputs) {
            return { value: () => inputs.value.get() };
        },
    });
    const runtime = Runtime.create();
    const owner = runtime.scope();
    const occurrences = integration.ComponentIntegration.createRuntime(runtime);
    const occurrence = occurrences.create(definition, {
        inputs: { value: 1 },
        owner,
    });

    assert.equal(Object.isFrozen(occurrences), true);
    assert.deepEqual(Object.keys(occurrences), []);
    assert.equal("engine" in occurrences, false);
    assert.equal("runtime" in occurrences, false);
    assert.ok(occurrence);
    assert.equal(Object.isFrozen(occurrence), true);
    assert.deepEqual(Object.keys(occurrence).sort(), ["attachment", "instance"]);
    assert.equal("lifecycle" in occurrence, false);
    assert.equal("scope" in occurrence, false);
    assert.equal("inputStore" in occurrence, false);
    assert.equal("updateInputs" in occurrence.instance, false);
    assert.equal(occurrence.instance.controller.value(), 1);

    occurrence.updateInputs({ value: 2 });
    assert.equal(occurrence.instance.controller.value(), 2);
    occurrence.dispose();
    assert.equal(occurrence.instance.disposed, true);
    runtime.dispose();
});

test("the compiled integration subpaths compose through public bridge capabilities", () => {
    const definition = Component.define({
        setup(_context, inputs) {
            return { value: () => inputs.value.get() };
        },
    });
    const runtime = Runtime.create();
    const owner = runtime.scope();
    const occurrence = integration.ComponentIntegration.createRuntime(runtime).create(definition, {
        inputs: { value: 1 },
        owner,
    });
    assert.ok(occurrence);
    const values = [];

    occurrence.attachment.run(() => {
        const binding = CoreIntegration.createRuntime(runtime).create(
            () => {
                values.push(occurrence.instance.controller.value());
            },
            () => assert.fail("Successful compiled bridge composition cannot terminalize."),
        );
        assert.ok(binding);
    });
    occurrence.updateInputs({ value: 2 });

    assert.deepEqual(values, [1, 2]);
    occurrence.dispose();
    runtime.dispose();
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

test("the package exports map rejects Component implementation subpaths", async () => {
    const implementationPaths = [
        "@lilium/component/runtime/component.engine.js",
        "@lilium/component/integration/runtime/component-occurrence-runtime.js",
        "@lilium/component/integration/contracts/component-occurrence.contract.js",
    ];

    for (const path of implementationPaths) {
        await assert.rejects(
            import(path),
            (error) => error?.code === "ERR_PACKAGE_PATH_NOT_EXPORTED",
        );
    }
});
