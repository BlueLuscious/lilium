import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { checkArchitecture } from "../../../tooling/architecture/check-architecture.mjs";

function writeJson(path, value) {
    writeFileSync(path, JSON.stringify(value));
}

function createPackage(
    root,
    name,
    dependencies = {},
    integration = true,
    privatePackage = false,
    conformance = false,
) {
    const packageRoot = join(root, "packages", name);
    mkdirSync(join(packageRoot, "src"), { recursive: true });
    writeFileSync(join(packageRoot, "src", "index.ts"), "export {};\n");
    const exports = {
        ".": {
            import: "./dist/index.js",
            types: "./dist/index.d.ts",
        },
    };

    if (integration) {
        exports["./integration"] = {
            import: "./dist/integration/index.js",
            types: "./dist/integration/index.d.ts",
        };
    }

    if (conformance) {
        exports["./conformance"] = {
            import: "./dist/conformance/index.js",
            types: "./dist/conformance/index.d.ts",
        };
    }

    writeJson(join(packageRoot, "package.json"), {
        dependencies,
        exports,
        private: privatePackage,
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
    createPackage(
        root,
        "template",
        {
            "@lilium/component": "workspace:*",
            "@lilium/core": "workspace:*",
        },
        false,
    );
    createPackage(root, "compiler", {}, false);
    createPackage(
        root,
        "renderer",
        {
            "@lilium/component": "workspace:*",
            "@lilium/core": "workspace:*",
            "@lilium/template": "workspace:*",
        },
        false,
        false,
        true,
    );
    createPackage(
        root,
        "renderer-console",
        {
            "@lilium/renderer": "workspace:*",
        },
        false,
        true,
    );
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

    test("rejects integration imports from Template declarations", (context) => {
        const root = createRepository(context);
        writeFileSync(
            join(root, "packages", "template", "src", "index.ts"),
            'import { CoreIntegration } from "@lilium/core/integration";\nvoid CoreIntegration;\n',
        );

        const violations = checkArchitecture(root);
        assert.equal(
            violations.some((violation) => violation.includes("template cannot depend")),
            true,
        );
    });

    test("accepts authorized Renderer integration imports", (context) => {
        const root = createRepository(context);
        writeFileSync(
            join(root, "packages", "renderer", "src", "index.ts"),
            'import { ComponentIntegration } from "@lilium/component/integration";\nimport { CoreIntegration } from "@lilium/core/integration";\nvoid ComponentIntegration;\nvoid CoreIntegration;\n',
        );

        assert.deepEqual(checkArchitecture(root), []);
    });

    test("keeps Compiler pure and independent from runtime and host modules", (context) => {
        const root = createRepository(context);
        writeFileSync(
            join(root, "packages", "compiler", "src", "index.ts"),
            'import { readFileSync } from "node:fs";\nimport { Renderer } from "@lilium/renderer";\nvoid readFileSync;\nvoid Renderer;\n',
        );

        const violations = checkArchitecture(root);
        assert.equal(
            violations.some((violation) => violation.includes("host module node:fs")),
            true,
        );
        assert.equal(
            violations.some((violation) =>
                violation.includes("compiler cannot depend on @lilium/renderer"),
            ),
            true,
        );
    });

    test("keeps Renderer Console private and dependent only on public Renderer", (context) => {
        const root = createRepository(context);
        const packageRoot = join(root, "packages", "renderer-console");
        writeFileSync(
            join(packageRoot, "src", "index.ts"),
            'import { Template } from "@lilium/template";\nvoid Template;\n',
        );
        const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
        manifest.private = false;
        writeJson(join(packageRoot, "package.json"), manifest);

        const violations = checkArchitecture(root);
        assert.equal(
            violations.some((violation) => violation.includes("cannot depend on @lilium/template")),
            true,
        );
        assert.equal(
            violations.some((violation) => violation.includes("private workspace package")),
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
