import type { CompilerDiagnostic } from "../contracts/compiler-diagnostic.contract.js";

/**
 * @description Orders diagnostics by their stable public deterministic ordering contract.
 * @param diagnostics - Diagnostics to sort without mutating caller storage.
 * @returns A frozen ordered diagnostic collection.
 */
export function sortCompilerDiagnostics(
    diagnostics: readonly CompilerDiagnostic[],
): readonly CompilerDiagnostic[] {
    return Object.freeze(
        [...diagnostics].sort(
            (left, right) =>
                left.span.start.offset - right.span.start.offset ||
                left.span.end.offset - right.span.end.offset ||
                left.code.localeCompare(right.code),
        ),
    );
}
