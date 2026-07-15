import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { checkJsdoc } from "../../../tooling/documentation/check-jsdoc.mjs";

function createRepository(context, source) {
    const root = mkdtempSync(join(tmpdir(), "lilium-jsdoc-"));
    mkdirSync(join(root, "packages", "fixture", "src"), { recursive: true });
    mkdirSync(join(root, "tooling"), { recursive: true });
    writeFileSync(join(root, "packages", "fixture", "src", "fixture.ts"), source);
    context.after(() => rmSync(root, { force: true, recursive: true }));
    return root;
}

describe("JSDoc checker", () => {
    test("accepts fully documented declarations", (context) => {
        const root = createRepository(
            context,
            "/**\n * @description Returns one value.\n * @param {string} value - Value to return.\n * @returns The received value.\n */\nexport function identity(value: string): string { return value; }\n",
        );
        assert.deepEqual(checkJsdoc(root), []);
    });

    test("reports missing descriptions, parameters, and returns", (context) => {
        const root = createRepository(
            context,
            "/** Documentation. */\nexport function identity(value: string): string { return value; }\n",
        );
        const violations = checkJsdoc(root);
        assert.equal(
            violations.some((violation) => violation.includes("missing @description")),
            true,
        );
        assert.equal(
            violations.some((violation) => violation.includes("missing @param value")),
            true,
        );
        assert.equal(
            violations.some((violation) => violation.includes("missing @returns")),
            true,
        );
    });
});
