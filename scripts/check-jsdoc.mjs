import { readdirSync, readFileSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import ts from "typescript";

/** @description Absolute repository root used to report stable source paths. */
const root = resolve(import.meta.dirname, "..");

/** @description Production source roots whose declarations require JSDoc. */
const productionRoots = [
    join(root, "packages", "core", "src"),
    join(root, "packages", "component", "src"),
    join(root, "scripts"),
];

/** @description Declaration kinds covered by the repository production JSDoc policy. */
const documentedKinds = new Set([
    ts.SyntaxKind.ClassDeclaration,
    ts.SyntaxKind.Constructor,
    ts.SyntaxKind.FunctionDeclaration,
    ts.SyntaxKind.GetAccessor,
    ts.SyntaxKind.InterfaceDeclaration,
    ts.SyntaxKind.MethodDeclaration,
    ts.SyntaxKind.MethodSignature,
    ts.SyntaxKind.PropertyDeclaration,
    ts.SyntaxKind.PropertySignature,
    ts.SyntaxKind.SetAccessor,
    ts.SyntaxKind.TypeAliasDeclaration,
    ts.SyntaxKind.VariableStatement,
]);

/** @description Collected JSDoc policy violations reported after every source is inspected. */
const violations = [];

/**
 * @description Recursively lists supported JavaScript and TypeScript source files.
 * @param {string} directory - Absolute directory to traverse.
 * @returns {string[]} Absolute source paths beneath the directory.
 */
const sourceFiles = (directory) =>
    readdirSync(directory, { withFileTypes: true })
        .flatMap((entry) => {
            const path = join(directory, entry.name);
            return entry.isDirectory() ? sourceFiles(path) : [path];
        })
        .filter((path) => [".js", ".mjs", ".ts"].includes(extname(path)))
        .filter((path) => basename(path) !== "index.ts");

/**
 * @description Finds the JSDoc block immediately leading one declaration.
 * @param {import("typescript").Node} node - Declaration whose leading comments are inspected.
 * @param {import("typescript").SourceFile} source - Parsed source containing the declaration.
 * @returns {string} Leading JSDoc text, or an empty string when absent.
 */
const jsDocOf = (node, source) => {
    const ranges = ts.getLeadingCommentRanges(source.text, node.getFullStart()) ?? [];
    const comments = ranges
        .map((range) => source.text.slice(range.pos, range.end))
        .filter((comment) => comment.startsWith("/**"));
    return comments.at(-1) ?? "";
};

/**
 * @description Records one JSDoc violation at a declaration's repository location.
 * @param {string} path - Absolute source path containing the declaration.
 * @param {import("typescript").Node} node - Declaration violating the policy.
 * @param {import("typescript").SourceFile} source - Parsed source containing the declaration.
 * @param {string} message - Human-readable policy failure.
 * @returns {void}
 */
const report = (path, node, source, message) => {
    const position = source.getLineAndCharacterOfPosition(node.getStart(source));
    violations.push(`${relative(root, path)}:${position.line + 1}: ${message}`);
};

/**
 * @description Reports missing parameter and generic tags for one callable declaration.
 * @param {string} path - Absolute source path containing the declaration.
 * @param {import("typescript").Node} node - Declaration whose tags are inspected.
 * @param {import("typescript").SourceFile} source - Parsed source containing the declaration.
 * @param {string} documentation - Leading JSDoc text attached to the declaration.
 * @returns {void}
 */
const inspectTags = (path, node, source, documentation) => {
    const callable =
        ts.isFunctionDeclaration(node) ||
        ts.isGetAccessor(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isMethodSignature(node) ||
        ts.isSetAccessor(node);
    const functionAlias = ts.isTypeAliasDeclaration(node) && ts.isFunctionTypeNode(node.type);
    const parameters = callable ? node.parameters : functionAlias ? node.type.parameters : [];
    const typeParameters = node.typeParameters ?? [];

    if ((callable || functionAlias) && !/@returns\b/.test(documentation)) {
        report(path, node, source, "missing @returns");
    }

    for (const parameter of parameters) {
        const name = parameter.name.getText(source);
        if (!documentation.includes(`@param ${name}`)) {
            report(path, node, source, `missing @param ${name}`);
        }
    }

    for (const parameter of typeParameters) {
        const name = parameter.name.text;
        if (!documentation.includes(`@typeParam ${name}`)) {
            report(path, node, source, `missing @typeParam ${name}`);
        }
    }
};

/**
 * @description Inspects every relevant declaration in one production source file.
 * @param {string} path - Absolute source path to parse and inspect.
 * @returns {void}
 */
const inspectSource = (path) => {
    const source = ts.createSourceFile(
        path,
        readFileSync(path, "utf8"),
        ts.ScriptTarget.Latest,
        true,
    );

    /**
     * @description Recursively inspects declarations contained by the parsed source.
     * @param {import("typescript").Node} node - Current syntax node being inspected.
     * @returns {void}
     */
    const visit = (node) => {
        if (documentedKinds.has(node.kind)) {
            const relevantVariable = !ts.isVariableStatement(node) || node.parent === source;

            if (relevantVariable) {
                const documentation = jsDocOf(node, source);

                if (documentation.length === 0) {
                    report(path, node, source, "missing JSDoc");
                } else {
                    if (!/@description\b/.test(documentation)) {
                        report(path, node, source, "missing @description");
                    }
                    inspectTags(path, node, source, documentation);
                }
            }
        }

        ts.forEachChild(node, visit);
    };

    visit(source);
};

for (const path of productionRoots.flatMap(sourceFiles)) {
    inspectSource(path);
}

if (violations.length > 0) {
    console.error(violations.join("\n"));
    process.exitCode = 1;
} else {
    console.log("Production JSDoc is valid.");
}
