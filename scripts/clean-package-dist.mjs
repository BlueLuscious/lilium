import { existsSync, readFileSync, rmSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

/** @description Absolute repository root containing the workspace package directory. */
const root = resolve(import.meta.dirname, "..");

/** @description Absolute workspace package root supplied by the package-manager script. */
const packageRoot = resolve(process.cwd());

/** @description Absolute directory containing every publishable workspace package. */
const packagesRoot = join(root, "packages");

/** @description Relative package path used to reject cleanup outside the workspace. */
const packagePath = relative(packagesRoot, packageRoot);

/** @description Package manifest used to verify that cleanup targets a package root. */
const packageManifest = join(packageRoot, "package.json");

/** @description Distribution directory removed before TypeScript emits a package build. */
const distribution = join(packageRoot, "dist");

if (
    packagePath.length === 0 ||
    packagePath.startsWith(`..${sep}`) ||
    packagePath === ".." ||
    isAbsolute(packagePath) ||
    !existsSync(packageManifest)
) {
    throw new Error("Package distribution cleanup must run from a workspace package root.");
}

/** @description Parsed manifest used to require an explicitly named workspace package. */
const manifest = JSON.parse(readFileSync(packageManifest, "utf8"));

if (typeof manifest.name !== "string" || manifest.name.length === 0) {
    throw new Error("Package distribution cleanup requires a named package manifest.");
}

rmSync(distribution, { force: true, recursive: true });
