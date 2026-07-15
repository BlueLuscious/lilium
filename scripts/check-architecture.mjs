import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

/** @description Absolute repository root used by every architecture check. */
const root = resolve(import.meta.dirname, "..");

/** @description Collected architecture violations reported after all checks complete. */
const violations = [];

/**
 * @description Recursively lists every file beneath one directory.
 * @param {string} directory - Absolute directory to traverse.
 * @returns {string[]} Absolute paths for all descendant files.
 */
const walk = (directory) =>
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name);
        return entry.isDirectory() ? walk(path) : [path];
    });

/**
 * @description Lists TypeScript production sources for one workspace package.
 * @param {string} packageName - Workspace package directory name.
 * @returns {string[]} Absolute TypeScript source paths.
 */
const sourceFiles = (packageName) =>
    walk(join(root, "packages", packageName, "src")).filter((path) => extname(path) === ".ts");

/**
 * @description Extracts static module specifiers from TypeScript source text.
 * @param {string} source - Source text to inspect.
 * @returns {string[]} Imported or reexported module specifiers.
 */
const importsOf = (source) =>
    [...source.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)].map((match) => match[1]);

/**
 * @description Records one repository-relative architecture violation.
 * @param {string} path - Absolute path containing the violation.
 * @param {string} message - Human-readable invariant failure.
 * @returns {void}
 */
const report = (path, message) => {
    violations.push(`${relative(root, path)}: ${message}`);
};

for (const path of sourceFiles("core")) {
    const source = readFileSync(path, "utf8");

    for (const dependency of importsOf(source)) {
        if (dependency.startsWith("@lilium/")) {
            report(path, `core cannot depend on ${dependency}`);
        }
    }

    if (/\b(?:HTMLElement|HTMLDocument|Document|Window)\b/.test(source)) {
        report(path, "core cannot reference DOM host types");
    }
}

for (const path of sourceFiles("component")) {
    const source = readFileSync(path, "utf8");

    for (const dependency of importsOf(source)) {
        if (dependency.startsWith("@lilium/") && dependency !== "@lilium/core") {
            report(path, `component cannot depend on ${dependency}`);
        }
    }

    if (/\b(?:HTMLElement|HTMLDocument|Document|Window)\b/.test(source)) {
        report(path, "component cannot reference DOM host types");
    }
}

for (const packageName of ["core", "component"]) {
    for (const path of sourceFiles(packageName)) {
        const source = readFileSync(path, "utf8");
        const normalizedPath = path.replaceAll("\\", "/");

        if (normalizedPath.includes("/contracts/") || normalizedPath.includes("/types/")) {
            for (const dependency of importsOf(source)) {
                if (/(?:^|\/)runtime\/(?!(?:contracts|types)(?:\/|$))/.test(dependency)) {
                    report(path, `contract/type cannot import the runtime layer ${dependency}`);
                }
            }
        }

        if (normalizedPath.endsWith("/src/index.ts")) {
            for (const dependency of importsOf(source)) {
                if (dependency.includes("/internal/")) {
                    report(path, `public package barrel cannot export internal path ${dependency}`);
                }
            }
        }
    }
}

/** @description Parsed Core package manifest used for dependency and export checks. */
const corePackage = JSON.parse(readFileSync(join(root, "packages/core/package.json"), "utf8"));

/** @description Parsed Component package manifest used for dependency and export checks. */
const componentPackage = JSON.parse(
    readFileSync(join(root, "packages/component/package.json"), "utf8"),
);

/** @description Parsed Core production compiler configuration used for host checks. */
const coreTsConfig = JSON.parse(readFileSync(join(root, "packages/core/tsconfig.json"), "utf8"));

/** @description Parsed Core test compiler configuration used for ambient-type checks. */
const coreTestTsConfig = JSON.parse(
    readFileSync(join(root, "packages/core/tsconfig.test.json"), "utf8"),
);

/** @description Parsed Component production compiler configuration used for host checks. */
const componentTsConfig = JSON.parse(
    readFileSync(join(root, "packages/component/tsconfig.json"), "utf8"),
);

/** @description Parsed Component test compiler configuration used for ambient-type checks. */
const componentTestTsConfig = JSON.parse(
    readFileSync(join(root, "packages/component/tsconfig.test.json"), "utf8"),
);

/** @description Direct dependencies declared by the Core package. */
const coreDependencies = Object.keys(corePackage.dependencies ?? {});

/** @description Direct dependencies declared by the Component package. */
const componentDependencies = Object.keys(componentPackage.dependencies ?? {});

/** @description Public subpaths declared by the Core package export map. */
const coreExportKeys = Object.keys(corePackage.exports ?? {});

/** @description Public subpaths declared by the Component package export map. */
const componentExportKeys = Object.keys(componentPackage.exports ?? {});

/**
 * @description Verifies one target-independent package compiler boundary.
 * @param {string} packageName - Workspace package directory and diagnostic name.
 * @param {Record<string, unknown>} productionConfig - Parsed production TypeScript config.
 * @param {Record<string, unknown>} testConfig - Parsed test TypeScript config.
 * @returns {void}
 */
const verifyHostIndependentCompilerConfig = (packageName, productionConfig, testConfig) => {
    const productionCompiler = productionConfig.compilerOptions ?? {};
    const testCompiler = testConfig.compilerOptions ?? {};
    const libraries = productionCompiler.lib ?? [];
    const productionTypes = productionCompiler.types ?? [];
    const testTypes = testCompiler.types ?? [];

    if (libraries.length !== 1 || libraries[0] !== "ES2022") {
        report(
            join(root, `packages/${packageName}/tsconfig.json`),
            `${packageName} production sources must compile against ES2022 only`,
        );
    }

    if (productionTypes.length !== 0) {
        report(
            join(root, `packages/${packageName}/tsconfig.json`),
            `${packageName} production sources cannot load ambient host type packages`,
        );
    }

    if (productionCompiler.noEmitOnError !== true) {
        report(
            join(root, `packages/${packageName}/tsconfig.json`),
            `${packageName} production builds must stop emit after type errors`,
        );
    }

    if (testCompiler.noEmit !== true) {
        report(
            join(root, `packages/${packageName}/tsconfig.test.json`),
            `${packageName} tests cannot emit distribution files`,
        );
    }

    if (testTypes.length !== 1 || testTypes[0] !== "node") {
        report(
            join(root, `packages/${packageName}/tsconfig.test.json`),
            `${packageName} tests must load only Node ambient types`,
        );
    }
};

verifyHostIndependentCompilerConfig("core", coreTsConfig, coreTestTsConfig);
verifyHostIndependentCompilerConfig("component", componentTsConfig, componentTestTsConfig);

if (coreExportKeys.length !== 1 || coreExportKeys[0] !== ".") {
    report(
        join(root, "packages/core/package.json"),
        "core must expose only its package root through the exports map",
    );
}

if (
    corePackage.exports?.["."]?.import !== "./dist/index.js" ||
    corePackage.exports?.["."]?.types !== "./dist/index.d.ts"
) {
    report(
        join(root, "packages/core/package.json"),
        "core package root must resolve to its built JavaScript and declarations",
    );
}

if (componentExportKeys.length !== 1 || componentExportKeys[0] !== ".") {
    report(
        join(root, "packages/component/package.json"),
        "component must expose only its package root through the exports map",
    );
}

if (
    componentPackage.exports?.["."]?.import !== "./dist/index.js" ||
    componentPackage.exports?.["."]?.types !== "./dist/index.d.ts"
) {
    report(
        join(root, "packages/component/package.json"),
        "component package root must resolve to its built JavaScript and declarations",
    );
}

if (coreDependencies.some((dependency) => dependency.startsWith("@lilium/"))) {
    report(
        join(root, "packages/core/package.json"),
        "core cannot depend on another Lilium package",
    );
}

for (const dependency of componentDependencies) {
    if (dependency.startsWith("@lilium/") && dependency !== "@lilium/core") {
        report(
            join(root, "packages/component/package.json"),
            `component cannot depend on ${dependency}`,
        );
    }
}

if (violations.length > 0) {
    console.error(violations.join("\n"));
    process.exitCode = 1;
} else {
    console.log("Architecture boundaries are valid.");
}
