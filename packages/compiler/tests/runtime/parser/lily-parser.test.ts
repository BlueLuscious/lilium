import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LilyParser } from "../../../src/parser/runtime/lily-parser.js";

describe("LilyParser", () => {
    it("preserves ordered imports, roots, nested nodes, properties, expressions, and spans", () => {
        const countInterpolation = "$" + "{controller.count.get()}";
        const source = [
            'behavior { CounterBehavior } from "./counter.behavior.js";',
            'primitives { Stack, Label, Action, } from "@example/primitives";',
            'properties { StackGap, LabelValue, ActionActivate } from "@example/primitives";',
            "template {",
            "    node Stack {",
            "        value StackGap = { size: [8, 12] };",
            "        node Label {",
            `            bind LabelValue = \`Count: ${countInterpolation}\`;`,
            "        }",
            "        node Action {",
            "            bind ActionActivate = controller.increment;",
            "        }",
            "    }",
            "}",
        ].join("\n");

        const result = new LilyParser(source, "src/counter.lily").parse();

        assert.deepEqual(result.diagnostics, []);
        assert.deepEqual(
            result.syntax.declarations.map((declaration) =>
                declaration.kind === "import" ? declaration.importKind : declaration.kind,
            ),
            ["behavior", "primitives", "properties", "template"],
        );

        const template = result.syntax.declarations.at(-1);
        assert.equal(template?.kind, "template");
        if (template?.kind !== "template") {
            assert.fail("Expected recovered template syntax.");
        }

        const root = template.declarations[0];
        assert.equal(root?.name, "Stack");
        assert.deepEqual(
            root?.declarations.map((declaration) =>
                declaration.kind === "property" ? declaration.propertyKind : declaration.name,
            ),
            ["value", "Label", "Action"],
        );

        const value = root?.declarations[0];
        assert.equal(value?.kind, "property");
        if (value?.kind === "property") {
            assert.equal(value.expression.raw, "{ size: [8, 12] }");
            assert.equal(
                source.slice(value.expression.span.start.offset, value.expression.span.end.offset),
                value.expression.raw,
            );
        }

        assert.deepEqual(result.syntax.span, {
            start: { offset: 0, line: 1, column: 1 },
            end: {
                offset: source.length,
                line: source.split("\n").length,
                column: 2,
            },
        });
    });

    it("recovers after missing semicolons and malformed declarations", () => {
        const source = [
            'behavior { Behavior } from "./behavior.js"',
            'primitives { Root } from "./primitives.js";',
            'properties { Label } from "./properties.js";',
            "template {",
            "    node Root {",
            '        value Label = "first"',
            "        style;",
            '        value Label = "second";',
            "    }",
            "}",
        ].join("\n");

        const result = new LilyParser(source, "recovery.lily").parse();
        const template = result.syntax.declarations.find(
            (declaration) => declaration.kind === "template",
        );

        assert.deepEqual(
            result.diagnostics.map((diagnostic) => diagnostic.code),
            ["LILY1004", "LILY1004", "LILY3011"],
        );
        assert.equal(template?.kind, "template");
        if (template?.kind === "template") {
            assert.deepEqual(
                template.declarations[0]?.declarations
                    .filter((declaration) => declaration.kind === "property")
                    .map((declaration) => declaration.expression.raw),
                ['"first"', '"second"'],
            );
        }
    });

    it("uses dedicated diagnostics for deferred structural source families", () => {
        const source = [
            "template {",
            "    setup;",
            "    interface;",
            "    component;",
            "    if;",
            "    each;",
            "    fragment;",
            "    async;",
            "    <;",
            "    style;",
            "    transition;",
            "    macro;",
            "    node Root {}",
            "}",
        ].join("\n");

        const result = new LilyParser(source, "unsupported.lily").parse();

        assert.deepEqual(
            result.diagnostics.map((diagnostic) => diagnostic.code),
            [
                "LILY3001",
                "LILY3003",
                "LILY3004",
                "LILY3005",
                "LILY3006",
                "LILY3007",
                "LILY3009",
                "LILY3010",
                "LILY3011",
                "LILY3012",
                "LILY3013",
            ],
        );
        assert.deepEqual(
            result.syntax.declarations
                .filter((declaration) => declaration.kind === "template")
                .flatMap((declaration) => declaration.declarations)
                .map((node) => node.name),
            ["Root"],
        );
    });

    it("rejects an empty named import list without losing later declarations", () => {
        const source = ['behavior {} from "./behavior.js";', "template { node Root {} }"].join(
            "\n",
        );
        const result = new LilyParser(source, "empty-import.lily").parse();

        assert.deepEqual(
            result.diagnostics.map((diagnostic) => diagnostic.code),
            ["LILY1005"],
        );
        assert.deepEqual(
            result.syntax.declarations.map((declaration) => declaration.kind),
            ["import", "template"],
        );
    });

    it("reports unexpected EOF without throwing and retains recovered syntax", () => {
        const source = [
            'behavior { Behavior } from "./behavior.js";',
            "template {",
            "    node Root {",
            '        value Label = "open";',
        ].join("\n");

        const result = new LilyParser(source, "eof.lily").parse();

        assert.deepEqual(
            result.diagnostics.map((diagnostic) => diagnostic.code),
            ["LILY1009", "LILY1009"],
        );
        assert.equal(result.syntax.declarations.length, 2);
        assert.ok(Object.isFrozen(result.syntax));
        assert.ok(Object.isFrozen(result.syntax.declarations));
        assert.ok(Object.isFrozen(result.diagnostics));
    });
});
