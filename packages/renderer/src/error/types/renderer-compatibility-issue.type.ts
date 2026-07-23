/**
 * @description Deterministic reason why a Template declaration cannot execute on one host.
 */
export type RendererCompatibilityIssueType =
    | "missing-primitive"
    | "missing-property"
    | "children-unsupported"
    | "primitive-mismatch"
    | "property-mismatch";
