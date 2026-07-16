import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { checkArchitecture } from "../../../tooling/architecture/check-architecture.mjs";

function writeJson(path, value) {
    writeFileSync(path, JSON.stringify(value));
}

function createPackage(root, name, dependencies = {}) {
    const packageRoot = join(root, "packages", name);
    mkdirSync(join(packageRoot, "src"), { recursive: true });
    writeFileSync(join(packageRoot, "src", "index.ts"), "export {};\n");
    writeJson(join(packageRoot, "package.json"), {
        dependencies,
        exports: {
            ".": {
                import: "./dist/index.js",
                types: "./dist/index.d.ts",
            },
            "./integration": {
                import: "./dist/integration/index.js",
                types: "./dist/integration/index.d.ts",
            },
        },
    });
    writeJson(join(packageRoot, "tsconfig.json"), {
        compilerOptions: { lib: ["ES2022"], noEmitOnError: true, types: [] },
    });
    writeJson(join(packageRoot, "tsconfig.test.json"), {
        compilerOptions: { noEmit: true, types: ["node"] },
    });
}

function createRepository(context) {
    const root = mkdtempSync(join(tmpdir(), "lilium-architecture-"));
    context.after(() => rmSync(root, { force: true, recursive: true }));
    createPackage(root, "core");
    createPackage(root, "component", { "@lilium/core": "workspace:*" });
    return root;
}

describe("architecture checker", () => {
    test("accepts the foundation package boundaries", (context) => {
        const root = createRepository(context);
        assert.deepEqual(checkArchitecture(root), []);
    });

    test("reports forbidden dependencies and host types", (context) => {
        const root = createRepository(context);
        writeFileSync(
            join(root, "packages", "core", "src", "index.ts"),
            'import type { ComponentDefinition } from "@lilium/component";\nconst host: Window;\n',
        );

        const violations = checkArchitecture(root);
        assert.equal(
            violations.some((violation) => violation.includes("@lilium/component")),
            true,
        );
        assert.equal(
            violations.some((violation) => violation.includes("DOM host types")),
            true,
        );
    });

    test("restricts Core integration imports to Component integration sources", (context) => {
        const root = createRepository(context);
        writeFileSync(
            join(root, "packages", "component", "src", "index.ts"),
            'import { CoreIntegration } from "@lilium/core/integration";\nvoid CoreIntegration;\n',
        );

        const violations = checkArchitecture(root);
        assert.equal(
            violations.some((violation) => violation.includes("root features cannot import")),
            true,
        );
    });

    test("reports invalid compiler and export boundaries", (context) => {
        const root = createRepository(context);
        writeJson(join(root, "packages", "component", "tsconfig.json"), {
            compilerOptions: { lib: ["ES2022", "DOM"], types: ["node"] },
        });
        writeJson(join(root, "packages", "component", "package.json"), {
            exports: { "./internal": "./dist/internal.js" },
        });

        const violations = checkArchitecture(root);
        assert.equal(
            violations.some((violation) => violation.includes("ES2022 only")),
            true,
        );
        assert.equal(
            violations.some((violation) => violation.includes("ambient host")),
            true,
        );
        assert.equal(
            violations.some((violation) => violation.includes("approved package paths")),
            true,
        );
    });
});
