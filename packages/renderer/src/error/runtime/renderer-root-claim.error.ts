import type { RendererRootClaimError as RendererRootClaimErrorContract } from "../contracts/renderer-root-claim-error.contract.js";

/** @description Concrete failure for one duplicate host-root session claim. */
export class RendererRootClaimError extends Error implements RendererRootClaimErrorContract {
    /** @description Stable error-family discriminant. */
    readonly name = "RendererRootClaimError" as const;

    /** @description External root whose exclusive claim was rejected. */
    readonly root: unknown;

    /**
     * @description Creates one duplicate root-claim failure.
     * @param root - External root already claimed for the same host adapter.
     */
    constructor(root: unknown) {
        super("The Renderer host root already has an active session.");
        this.root = root;
    }
}
