import assert from "node:assert/strict";
import test from "node:test";
import { Runtime } from "@lilium/core";
import * as rendererPackage from "@lilium/renderer";
import { Template } from "@lilium/template";

const { Renderer } = rendererPackage;

test("the package root exposes the exact frozen Renderer API snapshot", () => {
    assert.deepEqual(Object.keys(rendererPackage), ["Renderer"]);
    assert.deepEqual(Object.keys(Renderer), ["createRuntime"]);
    assert.equal(Object.isFrozen(Renderer), true);
    assert.throws(() => {
        Renderer.createRuntime = () => undefined;
    }, TypeError);
});

test("the compiled public API mounts and disposes one empty Template", () => {
    const runtime = Runtime.create();
    const calls = [];
    const host = {
        open(rootValue) {
            calls.push(["open", rootValue]);
            return {
                root: {},
                resolvePrimitive() {
                    return undefined;
                },
                place() {},
                remove() {},
                close() {
                    calls.push(["close"]);
                },
            };
        },
    };
    const renderer = Renderer.createRuntime(runtime, host);
    const state = {};
    const root = { name: "compiled" };
    const rendered = renderer.mountTemplate(Template.define({ roots: [] }), { root, state });

    assert.equal(Object.isFrozen(renderer), true);
    assert.deepEqual(Object.keys(renderer), []);
    assert.ok(rendered);
    assert.equal(Object.isFrozen(rendered), true);
    assert.equal(rendered.state, state);
    assert.deepEqual(calls, [["open", root]]);

    rendered.dispose();
    assert.equal(rendered.disposed, true);
    assert.deepEqual(calls, [["open", root], ["close"]]);
    runtime.dispose();
});

test("the compiled conformance subpath exposes only its frozen developer facade", async () => {
    const conformancePackage = await import("@lilium/renderer/conformance");

    assert.deepEqual(Object.keys(conformancePackage), ["RendererConformance"]);
    assert.deepEqual(Object.keys(conformancePackage.RendererConformance), ["scenarios"]);
    assert.equal(Object.isFrozen(conformancePackage.RendererConformance), true);
});

test("the package exports map rejects Renderer implementation subpaths", async () => {
    const implementationPaths = [
        "@lilium/renderer/api/renderer.api.js",
        "@lilium/renderer/conformance/runtime/renderer-conformance.scenario-factory.js",
        "@lilium/renderer/runtime/renderer-runtime.js",
        "@lilium/renderer/execution/runtime/renderer-instruction.executor.js",
        "@lilium/renderer/shared/runtime/renderer-cleanup.collector.js",
    ];

    for (const path of implementationPaths) {
        await assert.rejects(
            import(path),
            (error) => error?.code === "ERR_PACKAGE_PATH_NOT_EXPORTED",
        );
    }
});
