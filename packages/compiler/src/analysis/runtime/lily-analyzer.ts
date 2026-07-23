import type { CompilerDiagnostic } from "../../diagnostic/contracts/compiler-diagnostic.contract.js";
import { CompilerDiagnosticFactory } from "../../diagnostic/runtime/compiler-diagnostic.factory.js";
import { sortCompilerDiagnostics } from "../../diagnostic/runtime/sort-compiler-diagnostics.js";
import type { ICompilerExpressionIr } from "../../ir/contracts/internal/compiler-expression-ir.contract.js";
import type { ICompilerImportIr } from "../../ir/contracts/internal/compiler-import-ir.contract.js";
import type { ICompilerModuleIr } from "../../ir/contracts/internal/compiler-module-ir.contract.js";
import type { ICompilerNodeIr } from "../../ir/contracts/internal/compiler-node-ir.contract.js";
import type { ICompilerPropertyIr } from "../../ir/contracts/internal/compiler-property-ir.contract.js";
import type { ICompilerImportSyntax } from "../../parser/contracts/internal/compiler-import-syntax.contract.js";
import type { ICompilerNodeSyntax } from "../../parser/contracts/internal/compiler-node-syntax.contract.js";
import type { ICompilerParseResult } from "../../parser/contracts/internal/compiler-parse-result.contract.js";
import type { ICompilerPropertySyntax } from "../../parser/contracts/internal/compiler-property-syntax.contract.js";
import type { ICompilerTemplateSyntax } from "../../parser/contracts/internal/compiler-template-syntax.contract.js";
import type { TCompilerImportKind } from "../../parser/types/internal/compiler-import-kind.type.js";
import { CompilerSourceLocator } from "../../source/runtime/compiler-source-locator.js";
import type { ICompilerAnalysisResult } from "../contracts/internal/compiler-analysis-result.contract.js";
import type { TCompilerSymbol } from "../types/internal/compiler-symbol.type.js";
import type { TCompilerSymbolCategory } from "../types/internal/compiler-symbol-category.type.js";
import { LilyExpressionValidator } from "./lily-expression.validator.js";
import { lilyReservedIdentifiers } from "./lily-reserved-identifiers.js";

/**
 * @description Resolves Lily source semantics and lowers error-free syntax into normalized compiler IR.
 */
export class LilyAnalyzer {
    /** @description Explicit source identity attached to semantic diagnostics. */
    readonly #filename: string;

    /** @description Complete-source diagnostic factory. */
    readonly #diagnostics: CompilerDiagnosticFactory;

    /** @description Mutable semantic failures sorted when analysis completes. */
    readonly #failures: CompilerDiagnostic[] = [];

    /** @description Imported local symbols indexed by exact source name. */
    readonly #symbols = new Map<string, TCompilerSymbol>();

    /**
     * @description Creates a semantic analyzer for one explicit Lily source.
     * @param source - Original caller-supplied Lily source.
     * @param filename - Explicit source identity used by diagnostics.
     */
    public constructor(source: string, filename: string) {
        this.#filename = filename;
        this.#diagnostics = new CompilerDiagnosticFactory(
            filename,
            new CompilerSourceLocator(source),
        );
    }

    /**
     * @description Validates recovered syntax and returns IR only when no compiler error remains.
     * @param parsed - Recoverable parser output for the same source.
     * @returns Immutable ordered diagnostics and optional normalized module IR.
     */
    public analyze(parsed: ICompilerParseResult): ICompilerAnalysisResult {
        const imports: ICompilerImportSyntax[] = [];
        const templates: ICompilerTemplateSyntax[] = [];
        let templateSeen = false;

        for (const declaration of parsed.syntax.declarations) {
            if (declaration.kind === "template") {
                templateSeen = true;
                templates.push(declaration);
            } else {
                if (templateSeen) {
                    this.#report(
                        "LILY2012",
                        "All imports must appear before the template section.",
                        declaration.span.start.offset,
                        declaration.span.end.offset,
                    );
                }
                imports.push(declaration);
                this.#declareImport(declaration);
            }
        }

        const behaviorImports = imports.filter(
            (declaration) => declaration.importKind === "behavior",
        );
        const primitiveImports = imports.filter(
            (declaration) => declaration.importKind === "primitives",
        );
        const propertyImports = imports.filter(
            (declaration) => declaration.importKind === "properties",
        );

        this.#validateTopLevelCardinality(
            parsed,
            behaviorImports,
            primitiveImports,
            propertyImports,
            templates,
        );

        const roots = templates[0]?.declarations.map((node) => this.#lowerNode(node)) ?? [];
        const diagnostics = sortCompilerDiagnostics([...parsed.diagnostics, ...this.#failures]);
        const behavior = behaviorImports[0]?.names[0]?.name;

        if (diagnostics.length > 0 || behavior === undefined || templates[0] === undefined) {
            return Object.freeze({ ir: undefined, diagnostics });
        }

        const ir: ICompilerModuleIr = Object.freeze({
            imports: Object.freeze(imports.map((declaration) => this.#lowerImport(declaration))),
            behavior,
            roots: Object.freeze(roots),
            span: parsed.syntax.span,
        });

        return Object.freeze({ ir, diagnostics });
    }

    /**
     * @description Registers names from one import and diagnoses duplicate or reserved locals.
     * @param declaration - Parsed import declaration.
     * @returns Nothing.
     */
    #declareImport(declaration: ICompilerImportSyntax): void {
        const category = this.#symbolCategory(declaration.importKind);

        for (const imported of declaration.names) {
            if (lilyReservedIdentifiers.includes(imported.name)) {
                this.#report(
                    "LILY2008",
                    `Imported local '${imported.name}' is reserved by the compiler.`,
                    imported.span.start.offset,
                    imported.span.end.offset,
                );
            }

            if (this.#symbols.has(imported.name)) {
                this.#report(
                    "LILY2007",
                    `Imported local '${imported.name}' is already declared.`,
                    imported.span.start.offset,
                    imported.span.end.offset,
                );
                continue;
            }

            this.#symbols.set(
                imported.name,
                Object.freeze({
                    name: imported.name,
                    category,
                    span: imported.span,
                }),
            );
        }
    }

    /**
     * @description Validates required top-level categories and exact singleton declarations.
     * @param parsed - Parse result supplying the complete source EOF range.
     * @param behaviors - Ordered behavior imports.
     * @param primitives - Ordered primitive imports.
     * @param properties - Ordered property imports.
     * @param templates - Ordered template declarations.
     * @returns Nothing.
     */
    #validateTopLevelCardinality(
        parsed: ICompilerParseResult,
        behaviors: readonly ICompilerImportSyntax[],
        primitives: readonly ICompilerImportSyntax[],
        properties: readonly ICompilerImportSyntax[],
        templates: readonly ICompilerTemplateSyntax[],
    ): void {
        const eof = parsed.syntax.span.end.offset;

        if (behaviors.length === 0) {
            this.#report("LILY2001", "Expected exactly one behavior import.", eof, eof);
        }
        for (const duplicate of behaviors.slice(1)) {
            this.#report(
                "LILY2002",
                "Only one behavior import is allowed.",
                duplicate.span.start.offset,
                duplicate.span.end.offset,
            );
        }
        if (behaviors[0] !== undefined && behaviors[0].names.length !== 1) {
            this.#report(
                "LILY2012",
                "The behavior import must contain exactly one named definition.",
                behaviors[0].span.start.offset,
                behaviors[0].span.end.offset,
            );
        }
        if (primitives.length === 0) {
            this.#report("LILY2012", "Expected at least one primitives import.", eof, eof);
        }
        if (properties.length === 0) {
            this.#report("LILY2012", "Expected at least one properties import.", eof, eof);
        }
        if (templates.length === 0) {
            this.#report("LILY2005", "Expected exactly one template section.", eof, eof);
        }
        for (const duplicate of templates.slice(1)) {
            this.#report(
                "LILY2006",
                "Only one template section is allowed.",
                duplicate.span.start.offset,
                duplicate.span.end.offset,
            );
        }
    }

    /**
     * @description Validates and normalizes one primitive node recursively.
     * @param node - Parsed primitive node.
     * @returns Immutable normalized node IR.
     */
    #lowerNode(node: ICompilerNodeSyntax): ICompilerNodeIr {
        this.#requireSymbol(node.name, "primitive", "LILY2003", node.nameSpan);

        const properties: ICompilerPropertyIr[] = [];
        const children: ICompilerNodeIr[] = [];
        const propertyNames = new Set<string>();
        let childSeen = false;

        for (const declaration of node.declarations) {
            if (declaration.kind === "node") {
                childSeen = true;
                children.push(this.#lowerNode(declaration));
                continue;
            }

            if (childSeen) {
                this.#report(
                    "LILY2010",
                    `Property '${declaration.name}' must appear before child nodes.`,
                    declaration.nameSpan.start.offset,
                    declaration.nameSpan.end.offset,
                );
            }
            if (propertyNames.has(declaration.name)) {
                this.#report(
                    "LILY2011",
                    `Property '${declaration.name}' is already defined on this node.`,
                    declaration.nameSpan.start.offset,
                    declaration.nameSpan.end.offset,
                );
            } else {
                propertyNames.add(declaration.name);
            }

            properties.push(this.#lowerProperty(declaration));
        }

        return Object.freeze({
            primitive: node.name,
            properties: Object.freeze(properties),
            children: Object.freeze(children),
            primitiveSpan: node.nameSpan,
            span: node.span,
        });
    }

    /**
     * @description Validates and normalizes one static or binding property declaration.
     * @param property - Parsed property declaration.
     * @returns Immutable normalized property IR.
     */
    #lowerProperty(property: ICompilerPropertySyntax): ICompilerPropertyIr {
        this.#requireSymbol(property.name, "property", "LILY2004", property.nameSpan);

        const expressionFailures = new LilyExpressionValidator(
            property.expression.raw,
            property.expression.span.start.offset,
            property.propertyKind,
            this.#filename,
            this.#diagnostics,
        ).validate();
        this.#failures.push(...expressionFailures);

        const expression: ICompilerExpressionIr = Object.freeze({
            kind: property.propertyKind,
            source: property.expression.raw,
            span: property.expression.span,
        });

        return Object.freeze({
            property: property.name,
            expression,
            propertySpan: property.nameSpan,
            span: property.span,
        });
    }

    /**
     * @description Resolves one local name against its required capability category.
     * @param name - Referenced local source name.
     * @param category - Required imported capability category.
     * @param code - Stable unknown-category diagnostic code.
     * @param span - Exact referenced identifier range.
     * @returns Nothing.
     */
    #requireSymbol(
        name: string,
        category: TCompilerSymbolCategory,
        code: "LILY2003" | "LILY2004",
        span: ICompilerNodeSyntax["nameSpan"],
    ): void {
        if (this.#symbols.get(name)?.category !== category) {
            this.#report(
                code,
                `'${name}' is not an imported ${category}.`,
                span.start.offset,
                span.end.offset,
            );
        }
    }

    /**
     * @description Converts one parsed import into immutable generator-oriented IR.
     * @param declaration - Validated parsed import.
     * @returns Immutable import IR.
     */
    #lowerImport(declaration: ICompilerImportSyntax): ICompilerImportIr {
        return Object.freeze({
            kind: declaration.importKind,
            names: Object.freeze(declaration.names.map((imported) => imported.name)),
            source: declaration.source.raw,
            span: declaration.span,
        });
    }

    /**
     * @description Maps one source import kind into its semantic symbol category.
     * @param kind - Parsed import declaration category.
     * @returns Semantic local symbol category.
     */
    #symbolCategory(kind: TCompilerImportKind): TCompilerSymbolCategory {
        if (kind === "primitives") {
            return "primitive";
        }
        if (kind === "properties") {
            return "property";
        }
        return "behavior";
    }

    /**
     * @description Records one complete-source semantic diagnostic.
     * @param code - Stable semantic diagnostic identity.
     * @param message - Deterministic failure message.
     * @param start - Inclusive complete-source offset.
     * @param end - Exclusive complete-source offset.
     * @returns Nothing.
     */
    #report(code: CompilerDiagnostic["code"], message: string, start: number, end: number): void {
        this.#failures.push(this.#diagnostics.create(code, message, start, end));
    }
}
