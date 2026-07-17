import { readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { walkFiles } from "../shared/walk-files.mjs";

/** @description Architecture policies for the target-independent foundation packages. */
const packagePolicies = Object.freeze([
    Object.freeze({
        name: "core",
        allowedLiliumDependencies: Object.freeze([]),
        exports: Object.freeze({
            ".": "./dist/index",
            "./integration": "./dist/integration/index",
        }),
    }),
    Object.freeze({
        name: "component",
        allowedLiliumDependencies: Object.freeze(["@lilium/core", "@lilium/core/integration"]),
        exports: Object.freeze({
            ".": "./dist/index",
            "./integration": "./dist/integration/index",
        }),
    }),
    Object.freeze({
        name: "template",
        allowedLiliumDependencies: Object.freeze(["@lilium/core", "@lilium/component"]),
        exports: Object.freeze({
            ".": "./dist/index",
        }),
    }),
]);

/**
 * @description Parses one repository JSON file.
 * @param {string} path - Absolute JSON file path.
 * @returns {Record<string, any>} Parsed JSON object.
 */
function readJson(path) {
    return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * @description Lists TypeScript production sources for one workspace package.
 * @param {string} root - Absolute repository root.
 * @param {string} packageName - Workspace package directory name.
 * @returns {string[]} Absolute TypeScript source paths.
 */
function sourceFiles(root, packageName) {
    return walkFiles(join(root, "packages", packageName, "src")).filter(
        (path) => extname(path) === ".ts",
    );
}

/**
 * @description Extracts static module specifiers from TypeScript source text.
 * @param {string} source - Source text to inspect.
 * @returns {string[]} Imported or reexported module specifiers.
 */
function importsOf(source) {
    return [...source.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)].map((match) => match[1]);
}

/**
 * @description Verifies repository architecture policies without mutating the workspace.
 * @param {string} root - Absolute repository root to inspect.
 * @returns {string[]} Repository-relative architecture violations.
 */
export function checkArchitecture(root) {
    const violations = [];

    /**
     * @description Records one repository-relative architecture violation.
     * @param {string} path - Absolute path containing the violation.
     * @param {string} message - Human-readable invariant failure.
     * @returns {void}
     */
    const report = (path, message) => {
        violations.push(`${relative(root, path)}: ${message}`);
    };

    for (const policy of packagePolicies) {
        for (const path of sourceFiles(root, policy.name)) {
            const source = readFileSync(path, "utf8");
            const normalizedPath = path.replaceAll("\\", "/");

            for (const dependency of importsOf(source)) {
                if (
                    dependency.startsWith("@lilium/") &&
                    !policy.allowedLiliumDependencies.includes(dependency)
                ) {
                    report(path, `${policy.name} cannot depend on ${dependency}`);
                }

                if (
                    dependency === "@lilium/core/integration" &&
                    !normalizedPath.includes("/src/integration/")
                ) {
                    report(path, `${policy.name} root features cannot import Core integration`);
                }

                if (
                    (normalizedPath.includes("/contracts/") ||
                        normalizedPath.includes("/types/")) &&
                    /(?:^|\/)runtime\/(?!(?:contracts|types)(?:\/|$))/.test(dependency)
                ) {
                    report(path, `contract/type cannot import the runtime layer ${dependency}`);
                }

                if (normalizedPath.endsWith("/src/index.ts") && dependency.includes("/internal/")) {
                    report(path, `public package barrel cannot export internal path ${dependency}`);
                }
            }

            if (/\b(?:HTMLElement|HTMLDocument|Document|Window)\b/.test(source)) {
                report(path, `${policy.name} cannot reference DOM host types`);
            }
        }

        const packageRoot = join(root, "packages", policy.name);
        const manifestPath = join(packageRoot, "package.json");
        const productionConfigPath = join(packageRoot, "tsconfig.json");
        const testConfigPath = join(packageRoot, "tsconfig.test.json");
        const manifest = readJson(manifestPath);
        const productionConfig = readJson(productionConfigPath);
        const testConfig = readJson(testConfigPath);
        const dependencies = Object.keys(manifest.dependencies ?? {});
        const exportKeys = Object.keys(manifest.exports ?? {});
        const productionCompiler = productionConfig.compilerOptions ?? {};
        const testCompiler = testConfig.compilerOptions ?? {};
        const libraries = productionCompiler.lib ?? [];
        const productionTypes = productionCompiler.types ?? [];
        const testTypes = testCompiler.types ?? [];

        if (libraries.length !== 1 || libraries[0] !== "ES2022") {
            report(
                productionConfigPath,
                `${policy.name} production sources must compile against ES2022 only`,
            );
        }

        if (productionTypes.length !== 0) {
            report(
                productionConfigPath,
                `${policy.name} production sources cannot load ambient host type packages`,
            );
        }

        if (productionCompiler.noEmitOnError !== true) {
            report(
                productionConfigPath,
                `${policy.name} production builds must stop emit after type errors`,
            );
        }

        if (testCompiler.noEmit !== true) {
            report(testConfigPath, `${policy.name} tests cannot emit distribution files`);
        }

        if (testTypes.length !== 1 || testTypes[0] !== "node") {
            report(testConfigPath, `${policy.name} tests must load only Node ambient types`);
        }

        const expectedExportKeys = Object.keys(policy.exports);

        if (
            exportKeys.length !== expectedExportKeys.length ||
            expectedExportKeys.some((key) => !exportKeys.includes(key))
        ) {
            report(manifestPath, `${policy.name} must expose exactly its approved package paths`);
        }

        for (const [key, target] of Object.entries(policy.exports)) {
            if (
                manifest.exports?.[key]?.import !== `${target}.js` ||
                manifest.exports?.[key]?.types !== `${target}.d.ts`
            ) {
                report(
                    manifestPath,
                    `${policy.name} export ${key} must resolve to built JavaScript and declarations`,
                );
            }
        }

        for (const dependency of dependencies) {
            if (
                dependency.startsWith("@lilium/") &&
                !policy.allowedLiliumDependencies.includes(dependency)
            ) {
                report(manifestPath, `${policy.name} cannot depend on ${dependency}`);
            }
        }
    }

    return violations;
}
