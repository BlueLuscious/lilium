import { readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * @description Recursively lists every file beneath one directory.
 * @param {string} directory - Absolute directory to traverse.
 * @returns {string[]} Absolute paths for all descendant files.
 */
export function walkFiles(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name);
        return entry.isDirectory() ? walkFiles(path) : [path];
    });
}
