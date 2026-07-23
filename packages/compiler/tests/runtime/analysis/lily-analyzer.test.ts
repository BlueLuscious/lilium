import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ICompilerAnalysisResult } from "../../../src/analysis/contracts/internal/compiler-analysis-result.contract.js";
import { LilyAnalyzer } from "../../../src/analysis/runtime/lily-analyzer.js";
import { LilyParser } from "../../../src/parser/runtime/lily-parser.js";

function analyze(source: string, filename = "analysis.lily"): ICompilerAnalysisResult {
    const parsed = new LilyParser(source, filename).parse();
    return new LilyAnalyzer(source, filename).analyze(parsed);
}

describe("LilyAnalyzer", () => {
    it("resolves symbols and lowers valid syntax into deterministic immutable IR", () => {
        const interpolation = "$" + "{controller.count.get()}";
        const source = [
            'behavior { CounterBehavior } from "./counter.js";',
            'primitives { Stack, Label, Action } from "./primitives.js";',
            'properties { Gap, Text, Activate } from "./primitives.js";',
            "template {",
            "    node Stack {",
            "        value Gap = { compact: false, values: [-8, +12, null] };",
            "        node Label {",
            `            bind Text = controller.visible.get() ? \`Count: ${interpolation}\` : "Hidden";`,
            "        }",
            "        node Action {",
            "            bind Activate = controller.increment;",
            "        }",
            "    }",
            "}",
        ].join("\n");

        const result = analyze(source, "src/counter.lily");

        assert.deepEqual(result.diagnostics, []);
        assert.ok(result.ir);
        assert.equal(result.ir.behavior, "CounterBehavior");
        assert.deepEqual(
            result.ir.imports.map((declaration) => ({
                kind: declaration.kind,
                names: declaration.names,
                source: declaration.source,
            })),
            [
                {
                    kind: "behavior",
                    names: ["CounterBehavior"],
                    source: '"./counter.js"',
                },
                {
                    kind: "primitives",
                    names: ["Stack", "Label", "Action"],
                    source: '"./primitives.js"',
                },
                {
                    kind: "properties",
                    names: ["Gap", "Text", "Activate"],
                    source: '"./primitives.js"',
                },
            ],
        );

        const root = result.ir.roots[0];
        assert.deepEqual(
            {
                primitive: root?.primitive,
                properties: root?.properties.map((property) => ({
                    property: property.property,
                    kind: property.expression.kind,
                    source: property.expression.source,
                })),
                children: root?.children.map((child) => ({
                    primitive: child.primitive,
                    properties: child.properties.map((property) => ({
                        property: property.property,
                        kind: property.expression.kind,
                        source: property.expression.source,
                    })),
                })),
            },
            {
                primitive: "Stack",
                properties: [
                    {
                        property: "Gap",
                        kind: "value",
                        source: "{ compact: false, values: [-8, +12, null] }",
                    },
                ],
                children: [
                    {
                        primitive: "Label",
                        properties: [
                            {
                                property: "Text",
                                kind: "bind",
                                source: `controller.visible.get() ? \`Count: ${interpolation}\` : "Hidden"`,
                            },
                        ],
                    },
                    {
                        primitive: "Action",
                        properties: [
                            {
                                property: "Activate",
                                kind: "bind",
                                source: "controller.increment",
                            },
                        ],
                    },
                ],
            },
        );
        assert.ok(Object.isFrozen(result.ir));
        assert.ok(Object.isFrozen(result.ir.imports));
        assert.ok(Object.isFrozen(result.ir.roots));
    });

    it("reports top-level cardinality, ordering, duplicate, and reserved-name failures", () => {
        const source = [
            'behavior { First, Second } from "./first.js";',
            'primitives { Root, Root, Template } from "./primitives.js";',
            'properties { Value } from "./properties.js";',
            "template { node Root {} }",
            'behavior { Later } from "./later.js";',
        ].join("\n");

        const result = analyze(source);

        assert.equal(result.ir, undefined);
        assert.deepEqual(
            result.diagnostics.map((diagnostic) => diagnostic.code),
            ["LILY2012", "LILY2007", "LILY2008", "LILY2002", "LILY2012"],
        );
    });

    it("reports unresolved symbols, property ordering, and duplicate properties together", () => {
        const source = [
            'behavior { Behavior } from "./behavior.js";',
            'primitives { Root } from "./primitives.js";',
            'properties { Value } from "./properties.js";',
            "template {",
            "    node Missing {",
            "        node Root {}",
            '        value Unknown = "first";',
            "        bind Unknown = controller.value.get();",
            "    }",
            "}",
        ].join("\n");

        const result = analyze(source);

        assert.equal(result.ir, undefined);
        assert.deepEqual(
            result.diagnostics.map((diagnostic) => diagnostic.code),
            ["LILY2003", "LILY2004", "LILY2010", "LILY2004", "LILY2010", "LILY2011"],
        );
    });

    it("classifies unsupported and malformed expressions with exact source locations", () => {
        const source = [
            'behavior { Behavior } from "./behavior.js";',
            'primitives { Root } from "./primitives.js";',
            'properties { A, B, C, D, E } from "./properties.js";',
            "template {",
            "    node Root {",
            "        value A = controller.value;",
            "        bind B = controller.run();",
            "        bind C = (value) => value;",
            "        bind D = controller.value as string;",
            "        bind E = invoke();",
            "    }",
            "}",
        ].join("\n");

        const result = analyze(source, "expressions.lily");

        assert.equal(result.ir, undefined);
        assert.deepEqual(
            result.diagnostics.map((diagnostic) => diagnostic.code),
            ["LILY1007", "LILY3002", "LILY3008", "LILY3003", "LILY3002"],
        );
        for (const diagnostic of result.diagnostics) {
            assert.equal(diagnostic.filename, "expressions.lily");
            assert.equal(
                source.slice(diagnostic.span.start.offset, diagnostic.span.end.offset),
                diagnostic.code === "LILY1007"
                    ? "controller"
                    : diagnostic.code === "LILY3008"
                      ? "=>"
                      : diagnostic.code === "LILY3003"
                        ? "as"
                        : "(",
            );
        }
    });

    it("returns no IR when parser diagnostics already exist", () => {
        const source = [
            'behavior { Behavior } from "./behavior.js"',
            'primitives { Root } from "./primitives.js";',
            'properties { Value } from "./properties.js";',
            "template { node Root { value Value = 1; } }",
        ].join("\n");

        const result = analyze(source);

        assert.equal(result.ir, undefined);
        assert.deepEqual(
            result.diagnostics.map((diagnostic) => diagnostic.code),
            ["LILY1004"],
        );
    });
});
