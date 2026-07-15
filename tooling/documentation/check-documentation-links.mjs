import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { walkFiles } from "../shared/walk-files.mjs";

/**
 * @description Verifies local links in canonical English documentation.
 * @param {string} repositoryRoot - Absolute repository root used for diagnostics.
 * @param {string} documentationRoot - Absolute documentation directory to inspect.
 * @returns {string[]} Repository-relative broken-link violations.
 */
export function checkDocumentationLinks(repositoryRoot, documentationRoot) {
    const violations = [];
    const markdownFiles = walkFiles(documentationRoot).filter((path) => extname(path) === ".md");

    for (const path of markdownFiles) {
        const source = readFileSync(path, "utf8");

        for (const match of source.matchAll(/\[[^\]]*\]\(([^)#]+)(?:#[^)]+)?\)/g)) {
            const target = match[1];

            if (/^(?:https?:|mailto:)/.test(target)) {
                continue;
            }

            if (!existsSync(resolve(dirname(path), target))) {
                violations.push(`${relative(repositoryRoot, path)}: broken link ${target}`);
            }
        }
    }

    return violations;
}
