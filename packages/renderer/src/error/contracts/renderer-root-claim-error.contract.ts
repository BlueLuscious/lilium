/**
 * @description Structured failure produced when one host root already has an active session.
 * @remarks Claims use host and root identity. Closing the active session releases its claim even
 * when host cleanup reports an error.
 */
export interface RendererRootClaimError extends Error {
    /** @description Stable error-family discriminant. */
    readonly name: "RendererRootClaimError";

    /** @description External root whose exclusive claim was rejected. */
    readonly root: unknown;
}
