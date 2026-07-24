import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { Compiler } from "../../../src/index.js";

const fixtureRoot = fileURLToPath(new URL("../../fixtures/golden/", import.meta.url));
const requiredFixtures = [
    "comments-and-crlf",
    "duplicate-properties",
    "forbidden-bindings",
    "literal-values",
    "multiple-roots-and-imports",
    "nested-values-and-bindings",
    "smallest-useful",
    "top-level-cardinality",
    "unknown-symbols",
    "unsupported-structures",
];

function serialize(value: unknown): string {
    return `${JSON.stringify(value, undefined, 4)}\n`;
}

describe("Compiler golden conformance", () => {
    const fixtures = readdirSync(fixtureRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();

    it("contains the complete first-milestone fixture matrix", () => {
        assert.deepEqual(fixtures, requiredFixtures);
    });

    for (const fixture of fixtures) {
        it(`matches ${fixture}`, () => {
            const directory = join(fixtureRoot, fixture);
            const source = readFileSync(join(directory, "input.lily"), "utf8");
            const filename = `fixtures/${fixture}/input.lily`;
            const first = Compiler.compile(source, { filename });
            const second = Compiler.compile(source, { filename });

            assert.equal(serialize(first), serialize(second));
            assert.equal(
                serialize(first.diagnostics),
                readFileSync(join(directory, "expected.diagnostics.json"), "utf8"),
            );

            if (first.output === undefined) {
                assert.throws(() => readFileSync(join(directory, "expected.js"), "utf8"));
                assert.throws(() => readFileSync(join(directory, "expected.map.json"), "utf8"));
                return;
            }

            assert.equal(first.output.code, readFileSync(join(directory, "expected.js"), "utf8"));
            assert.equal(
                serialize(first.output.map),
                readFileSync(join(directory, "expected.map.json"), "utf8"),
            );
        });
    }
});
