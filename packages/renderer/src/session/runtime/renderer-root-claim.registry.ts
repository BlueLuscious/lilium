import { RendererRootClaimError } from "../../error/runtime/renderer-root-claim.error.js";

/** @description Process-local host-and-root identity registry for exclusive active sessions. */
export class RendererRootClaimRegistry {
    /** @description Active root claims grouped by reusable host adapter identity. */
    readonly #claims = new WeakMap<object, Map<unknown, symbol>>();

    /**
     * @description Claims one root exclusively for one host adapter identity.
     * @param host - Reusable host adapter identity.
     * @param root - External root identity or primitive value.
     * @returns An idempotent release operation scoped to this exact claim.
     */
    claim(host: object, root: unknown): () => void {
        let hostClaims = this.#claims.get(host);

        if (hostClaims === undefined) {
            hostClaims = new Map();
            this.#claims.set(host, hostClaims);
        }

        if (hostClaims.has(root)) {
            throw new RendererRootClaimError(root);
        }

        const token = Symbol("renderer-root-claim");
        hostClaims.set(root, token);
        let released = false;

        return () => {
            if (released) {
                return;
            }

            released = true;

            if (hostClaims?.get(root) === token) {
                hostClaims.delete(root);

                if (hostClaims.size === 0) {
                    this.#claims.delete(host);
                }
            }
        };
    }
}
