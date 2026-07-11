import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const violations = [];

const walk = (directory) => readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
        const path = join(directory, entry.name);
        return entry.isDirectory() ? walk(path) : [path];
    });

const sourceFiles = (packageName) => walk(join(root, "packages", packageName, "src"))
    .filter((path) => extname(path) === ".ts");

const importsOf = (source) => [
    ...source.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g),
].map((match) => match[1]);

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
                if (/\.(?:runtime|manager|engine)\.js$/.test(dependency)) {
                    report(path, `contract/type cannot import runtime implementation ${dependency}`);
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

const corePackage = JSON.parse(readFileSync(join(root, "packages/core/package.json"), "utf8"));
const componentPackage = JSON.parse(readFileSync(join(root, "packages/component/package.json"), "utf8"));
const coreDependencies = Object.keys(corePackage.dependencies ?? {});
const componentDependencies = Object.keys(componentPackage.dependencies ?? {});

if (coreDependencies.some((dependency) => dependency.startsWith("@lilium/"))) {
    report(join(root, "packages/core/package.json"), "core cannot depend on another Lilium package");
}

for (const dependency of componentDependencies) {
    if (dependency.startsWith("@lilium/") && dependency !== "@lilium/core") {
        report(join(root, "packages/component/package.json"), `component cannot depend on ${dependency}`);
    }
}

if (violations.length > 0) {
    console.error(violations.join("\n"));
    process.exitCode = 1;
} else {
    console.log("Architecture boundaries are valid.");
}
