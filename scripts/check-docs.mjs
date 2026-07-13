import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";

/** @description Absolute repository root used to resolve documentation paths. */
const root = resolve(import.meta.dirname, "..");

/** @description Canonical English documentation root inspected for local links. */
const documentationRoot = join(root, "docs", "en");

/** @description Broken local documentation links collected across Markdown files. */
const violations = [];

/**
 * @description Recursively lists Markdown files beneath one documentation directory.
 * @param {string} directory - Absolute directory to traverse.
 * @returns {string[]} Absolute Markdown paths beneath the directory.
 */
const markdownFiles = (directory) =>
    readdirSync(directory, { withFileTypes: true })
        .flatMap((entry) => {
            const path = join(directory, entry.name);
            return entry.isDirectory() ? markdownFiles(path) : [path];
        })
        .filter((path) => extname(path) === ".md");

for (const path of markdownFiles(documentationRoot)) {
    const source = readFileSync(path, "utf8");

    for (const match of source.matchAll(/\[[^\]]*\]\(([^)#]+)(?:#[^)]+)?\)/g)) {
        const target = match[1];

        if (/^(?:https?:|mailto:)/.test(target)) {
            continue;
        }

        if (!existsSync(resolve(dirname(path), target))) {
            violations.push(`${relative(root, path)}: broken link ${target}`);
        }
    }
}

if (violations.length > 0) {
    console.error(violations.join("\n"));
    process.exitCode = 1;
} else {
    console.log("Documentation links are valid.");
}
