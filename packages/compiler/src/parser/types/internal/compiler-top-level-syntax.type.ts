import type { ICompilerImportSyntax } from "../../contracts/internal/compiler-import-syntax.contract.js";
import type { ICompilerTemplateSyntax } from "../../contracts/internal/compiler-template-syntax.contract.js";

/** @description Ordered union of recoverably parsed top-level Lily declarations. */
export type TCompilerTopLevelSyntax = ICompilerImportSyntax | ICompilerTemplateSyntax;
