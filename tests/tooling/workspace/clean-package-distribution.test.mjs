import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { cleanPackageDistribution } from "../../../tooling/workspace/clean-package-distribution.mjs";

function createRepository(context) {
    const root = mkdtempSync(join(tmpdir(), "lilium-cleaner-"));
    context.after(() => rmSync(root, { force: true, recursive: true }));
    return root;
}

describe("package distribution cleaner", () => {
    test("removes only the selected direct package distribution", (context) => {
        const root = createRepository(context);
        const packageRoot = join(root, "packages", "core");
        mkdirSync(join(packageRoot, "dist"), { recursive: true });
        writeFileSync(join(packageRoot, "package.json"), '{"name":"@lilium/core"}');
        writeFileSync(join(packageRoot, "dist", "index.js"), "export {};\n");

        cleanPackageDistribution(root, packageRoot);

        assert.equal(existsSync(join(packageRoot, "dist")), false);
        assert.equal(existsSync(join(packageRoot, "package.json")), true);
    });

    test("rejects directories outside the direct package boundary", (context) => {
        const root = createRepository(context);
        const outside = join(root, "outside");
        mkdirSync(join(outside, "dist"), { recursive: true });
        writeFileSync(join(outside, "package.json"), '{"name":"outside"}');

        assert.throws(() => cleanPackageDistribution(root, outside));
        assert.equal(existsSync(join(outside, "dist")), true);
    });

    test("rejects unnamed package manifests", (context) => {
        const root = createRepository(context);
        const packageRoot = join(root, "packages", "unnamed");
        mkdirSync(join(packageRoot, "dist"), { recursive: true });
        writeFileSync(join(packageRoot, "package.json"), "{}");

        assert.throws(() => cleanPackageDistribution(root, packageRoot));
        assert.equal(existsSync(join(packageRoot, "dist")), true);
    });
});
