import assert from "node:assert/strict";
import test from "node:test";
import * as compilerPackage from "@lilium/compiler";

const { Compiler } = compilerPackage;

test("the package root exposes only the frozen Compiler API value", () => {
    assert.deepEqual(Object.keys(compilerPackage), ["Compiler"]);
    assert.deepEqual(Object.keys(Compiler), ["compile"]);
    assert.equal(Object.isFrozen(Compiler), true);
    assert.throws(() => {
        Compiler.compile = () => undefined;
    }, TypeError);
});

test("the compiled package produces immutable output through its public root", () => {
    const source = [
        'behavior { Behavior } from "./behavior.js";',
        'primitives { Root } from "./ui.js";',
        'properties { Value } from "./ui.js";',
        "template { node Root { value Value = 1; } }",
    ].join("\n");
    const result = Compiler.compile(source, { filename: "public.lily" });

    assert.deepEqual(result.diagnostics, []);
    assert.match(result.output.code, /Template\.value\(Value, 1\)/);
    assert.equal(result.output.map.sourcesContent[0], source);
    assert.equal(Object.isFrozen(result), true);
    assert.equal(Object.isFrozen(result.output), true);
    assert.equal(Object.isFrozen(result.output.map), true);
});

test("the package exports map rejects Compiler implementation subpaths", async () => {
    const implementationPaths = [
        "@lilium/compiler/api/compiler.api.js",
        "@lilium/compiler/generator/runtime/lily-generator.js",
        "@lilium/compiler/analysis/runtime/lily-analyzer.js",
        "@lilium/compiler/parser/runtime/lily-parser.js",
    ];

    for (const path of implementationPaths) {
        await assert.rejects(
            import(path),
            (error) => error?.code === "ERR_PACKAGE_PATH_NOT_EXPORTED",
        );
    }
});
