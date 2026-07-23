import type { RendererCompatibilityError as RendererCompatibilityErrorContract } from "../contracts/renderer-compatibility-error.contract.js";
import type { RendererCompatibilityIssueType } from "../types/renderer-compatibility-issue.type.js";
import type { RendererCompatibilitySubjectType } from "../types/renderer-compatibility-subject.type.js";

/** @description Concrete deterministic host compatibility failure created during preflight. */
export class RendererCompatibilityError
    extends Error
    implements RendererCompatibilityErrorContract
{
    /** @description Stable error-family discriminant. */
    readonly name = "RendererCompatibilityError" as const;

    /** @description Exact unsupported capability relationship. */
    readonly issue: RendererCompatibilityIssueType;

    /** @description Requested Template identity associated with the failure. */
    readonly subject: RendererCompatibilitySubjectType;

    /**
     * @description Creates one structured compatibility failure.
     * @param issue - Exact unsupported capability relationship.
     * @param subject - Requested Template primitive or property identity.
     */
    constructor(issue: RendererCompatibilityIssueType, subject: RendererCompatibilitySubjectType) {
        super(`Renderer host compatibility failed: ${issue}.`);
        this.issue = issue;
        this.subject = subject;
    }
}
