import { existsSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/**
 * @description Removes one direct workspace package distribution after validating its boundary.
 * @remarks The real package root must be a direct child of `packages/` and contain a named manifest.
 * @param {string} repositoryRoot - Absolute repository root containing the package workspace.
 * @param {string} packageRoot - Absolute package root whose `dist/` directory will be removed.
 * @returns {void}
 */
export function cleanPackageDistribution(repositoryRoot, packageRoot) {
    const resolvedRepositoryRoot = resolve(repositoryRoot);
    const resolvedPackageRoot = resolve(packageRoot);
    const resolvedPackagesRoot = join(resolvedRepositoryRoot, "packages");

    if (!existsSync(resolvedPackagesRoot) || !existsSync(resolvedPackageRoot)) {
        throw new Error("Package distribution cleanup must run from a workspace package root.");
    }

    const packagesRoot = realpathSync(resolvedPackagesRoot);
    const realPackageRoot = realpathSync(resolvedPackageRoot);
    const packageManifest = join(realPackageRoot, "package.json");

    if (dirname(realPackageRoot) !== packagesRoot || !existsSync(packageManifest)) {
        throw new Error("Package distribution cleanup must run from a workspace package root.");
    }

    const manifest = JSON.parse(readFileSync(packageManifest, "utf8"));

    if (typeof manifest.name !== "string" || manifest.name.length === 0) {
        throw new Error("Package distribution cleanup requires a named package manifest.");
    }

    rmSync(join(realPackageRoot, "dist"), { force: true, recursive: true });
}
