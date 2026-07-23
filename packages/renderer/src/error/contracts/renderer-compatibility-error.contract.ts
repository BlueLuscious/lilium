import type { RendererCompatibilityIssueType } from "../types/renderer-compatibility-issue.type.js";
import type { RendererCompatibilitySubjectType } from "../types/renderer-compatibility-subject.type.js";

/**
 * @description Structured deterministic failure produced by host capability preflight.
 * @remarks Concrete instances are created by Renderer and reported through Core ownership error
 * boundaries before any component setup or host mutation occurs.
 */
export interface RendererCompatibilityError extends Error {
    /** @description Stable error-family discriminant. */
    readonly name: "RendererCompatibilityError";

    /** @description Exact unsupported capability relationship. */
    readonly issue: RendererCompatibilityIssueType;

    /** @description Template primitive or property identity that failed compatibility preflight. */
    readonly subject: RendererCompatibilitySubjectType;
}
