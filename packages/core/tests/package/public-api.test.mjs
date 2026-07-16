import assert from "node:assert/strict";
import test from "node:test";
import * as core from "@lilium/core";
import * as integration from "@lilium/core/integration";

const { Context, Runtime } = core;

test("the package root exposes only immutable public API values", () => {
    assert.deepEqual(Object.keys(core).sort(), ["Context", "Runtime"]);
    assert.equal(Object.isFrozen(Context), true);
    assert.equal(Object.isFrozen(Runtime), true);
    assert.throws(() => {
        Runtime.create = () => undefined;
    }, TypeError);
    assert.throws(() => {
        Context.create = () => undefined;
    }, TypeError);
});

test("the integration subpath is supported without enlarging the package root", () => {
    assert.deepEqual(Object.keys(integration), ["CoreIntegration"]);
    assert.equal(Object.isFrozen(integration.CoreIntegration), true);
    assert.equal("CoreIntegration" in core, false);
});

test("the compiled integration API validates genuine live runtimes", () => {
    const runtime = Runtime.create();

    assert.doesNotThrow(() => integration.CoreIntegration.assertRuntime(runtime));
    assert.throws(
        () => integration.CoreIntegration.assertRuntime({}),
        /genuine Lilium reactive runtime/i,
    );
    runtime.dispose();
    assert.throws(
        () => integration.CoreIntegration.assertRuntime(runtime),
        /disposed reactive runtime/i,
    );
});

test("the compiled integration API creates protected render bindings", () => {
    const runtime = Runtime.create();
    const bindings = integration.CoreIntegration.createRuntime(runtime);
    const source = runtime.signal(1);
    const values = [];
    const binding = bindings.create(
        () => {
            values.push(source.get());
        },
        () => assert.fail("Successful package binding cannot terminalize."),
    );

    assert.equal(Object.isFrozen(bindings), true);
    assert.deepEqual(Object.keys(bindings), []);
    assert.equal("scheduler" in bindings, false);
    assert.equal("tracker" in bindings, false);
    assert.equal("ownership" in bindings, false);
    assert.ok(binding);
    assert.equal(Object.isFrozen(binding), true);
    assert.deepEqual(Object.keys(binding), []);
    assert.equal("execute" in binding, false);
    assert.equal("invalidate" in binding, false);
    assert.equal("runtime" in binding, false);
    assert.equal("phase" in binding, false);
    source.set(2);
    assert.deepEqual(values, [1, 2]);

    binding.dispose();
    runtime.dispose();
});

test("Runtime.create returns isolated frozen reactive runtimes", () => {
    const first = Runtime.create();
    const second = Runtime.create();
    const firstValue = first.signal(1);
    const secondValue = second.signal(10);

    assert.notEqual(first, second);
    assert.equal(Object.isFrozen(first), true);
    firstValue.set(2);
    assert.equal(firstValue.get(), 2);
    assert.equal(secondValue.get(), 10);

    first.dispose();
    assert.throws(() => firstValue.get(), /disposed/i);
    assert.equal(secondValue.get(), 10);
    second.dispose();
});

test("runtime scope creation validates child ownership", () => {
    const first = Runtime.create();
    const second = Runtime.create();
    const owner = first.scope();
    const child = first.scope(owner);

    assert.throws(() => second.scope(owner), /runtime owner/i);
    assert.throws(() => first.scope({}), /not a Lilium scope/i);
    owner.dispose();
    assert.throws(() => child.run(() => undefined), /disposed/i);

    first.dispose();
    second.dispose();
});

test("runtime disposal recursively releases owned resources once", () => {
    const runtime = Runtime.create();
    const scope = runtime.scope();
    const releases = [];

    scope.run(() => {
        scope.cleanup(() => {
            releases.push("scope");
        });
        runtime.effect((execution) => {
            execution.cleanup(() => {
                releases.push("effect");
            });
        });
    });

    runtime.dispose();
    runtime.dispose();

    assert.deepEqual(releases, ["effect", "scope"]);
});

test("runtime disposal cancels work pending behind a batch boundary", () => {
    const runtime = Runtime.create();
    let executions = 0;

    runtime.batch(() => {
        runtime.effect(() => {
            executions += 1;
        });
        runtime.dispose();
    });

    assert.equal(executions, 0);
    assert.throws(() => runtime.signal(1), /disposed/i);
});

test("contexts reuse identity without sharing provider values across runtimes", () => {
    const Theme = Context.create();
    const first = Runtime.create();
    const second = Runtime.create();
    const firstScope = first.scope();
    const secondScope = second.scope();

    Theme.provide(firstScope, "light");
    Theme.provide(secondScope, "dark");
    firstScope.run(() => assert.equal(Theme.get(), "light"));
    secondScope.run(() => assert.equal(Theme.get(), "dark"));
    assert.throws(() => Theme.get(), /No value/i);

    first.dispose();
    second.dispose();
});

test("Context.create distinguishes omitted and explicit undefined defaults", () => {
    const required = Context.create();
    const defaulted = Context.create(undefined);

    assert.throws(() => required.get(), /No value/i);
    assert.equal(defaulted.get(), undefined);
});

test("the package exports map rejects Core implementation subpaths", async () => {
    const implementationPaths = [
        "@lilium/core/reactivity/runtime/signal/signal.runtime.js",
        "@lilium/core/integration/runtime/render-binding-runtime.js",
        "@lilium/core/integration/contracts/render-binding.contract.js",
    ];

    for (const path of implementationPaths) {
        await assert.rejects(
            import(path),
            (error) => error?.code === "ERR_PACKAGE_PATH_NOT_EXPORTED",
        );
    }
});
