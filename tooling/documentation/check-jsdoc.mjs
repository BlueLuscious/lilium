import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import ts from "typescript";
import { walkFiles } from "../shared/walk-files.mjs";

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

/**
 * @description Finds the JSDoc block immediately leading one declaration.
 * @param {import("typescript").Node} node - Declaration whose leading comments are inspected.
 * @param {import("typescript").SourceFile} source - Parsed source containing the declaration.
 * @returns {string} Leading JSDoc text, or an empty string when absent.
 */
function jsDocOf(node, source) {
    const ranges = ts.getLeadingCommentRanges(source.text, node.getFullStart()) ?? [];
    const comments = ranges
        .map((range) => source.text.slice(range.pos, range.end))
        .filter((comment) => comment.startsWith("/**"));
    return comments.at(-1) ?? "";
}

/**
 * @description Determines whether one JSDoc block declares a named tag with an optional type.
 * @param {string} documentation - Complete JSDoc block to inspect.
 * @param {string} tag - Tag name without the leading at sign.
 * @param {string} name - Parameter or generic name required by the declaration.
 * @returns {boolean} Whether the named tag exists.
 */
function hasNamedTag(documentation, tag, name) {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`@${tag}\\s+(?:\\{[^}\\r\\n]+\\}\\s+)?${escapedName}(?:\\s|$)`).test(
        documentation,
    );
}

/**
 * @description Lists production roots whose declarations require JSDoc.
 * @param {string} root - Absolute repository root.
 * @returns {string[]} Absolute package source and repository tooling roots.
 */
function productionRoots(root) {
    const packagesRoot = join(root, "packages");
    const packageSources = readdirSync(packagesRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(packagesRoot, entry.name, "src"))
        .filter(existsSync);
    return [...packageSources, join(root, "tooling")];
}

/**
 * @description Verifies the mandatory production JSDoc policy.
 * @param {string} root - Absolute repository root to inspect.
 * @returns {string[]} Repository-relative JSDoc violations with source lines.
 */
export function checkJsdoc(root) {
    const violations = [];
    const sources = productionRoots(root).flatMap((directory) =>
        walkFiles(directory)
            .filter((path) => [".js", ".mjs", ".ts"].includes(extname(path)))
            .filter((path) => basename(path) !== "index.ts"),
    );

    for (const path of sources) {
        const source = ts.createSourceFile(
            path,
            readFileSync(path, "utf8"),
            ts.ScriptTarget.Latest,
            true,
        );

        /**
         * @description Records one JSDoc violation at a declaration's repository location.
         * @param {import("typescript").Node} node - Declaration violating the policy.
         * @param {string} message - Human-readable policy failure.
         * @returns {void}
         */
        const report = (node, message) => {
            const position = source.getLineAndCharacterOfPosition(node.getStart(source));
            violations.push(`${relative(root, path)}:${position.line + 1}: ${message}`);
        };

        /**
         * @description Reports missing callable parameter, return, and generic tags.
         * @param {import("typescript").Node} node - Declaration whose tags are inspected.
         * @param {string} documentation - Leading JSDoc text attached to the declaration.
         * @returns {void}
         */
        const inspectTags = (node, documentation) => {
            const callable =
                ts.isFunctionDeclaration(node) ||
                ts.isGetAccessor(node) ||
                ts.isMethodDeclaration(node) ||
                ts.isMethodSignature(node) ||
                ts.isSetAccessor(node);
            const functionAlias =
                ts.isTypeAliasDeclaration(node) && ts.isFunctionTypeNode(node.type);
            const parameters = callable
                ? node.parameters
                : functionAlias
                  ? node.type.parameters
                  : [];
            const typeParameters = node.typeParameters ?? [];

            if ((callable || functionAlias) && !/@returns\b/.test(documentation)) {
                report(node, "missing @returns");
            }

            for (const parameter of parameters) {
                const name = parameter.name.getText(source);
                if (!hasNamedTag(documentation, "param", name)) {
                    report(node, `missing @param ${name}`);
                }
            }

            for (const parameter of typeParameters) {
                const name = parameter.name.text;
                if (!hasNamedTag(documentation, "typeParam", name)) {
                    report(node, `missing @typeParam ${name}`);
                }
            }
        };

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
                        report(node, "missing JSDoc");
                    } else {
                        if (!/@description\b/.test(documentation)) {
                            report(node, "missing @description");
                        }
                        inspectTags(node, documentation);
                    }
                }
            }

            ts.forEachChild(node, visit);
        };

        visit(source);
    }

    return violations;
}
