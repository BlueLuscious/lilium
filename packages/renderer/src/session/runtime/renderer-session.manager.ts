import { RendererProtocolError } from "../../error/runtime/renderer-protocol.error.js";
import type { RendererHost } from "../../host/contracts/renderer-host.contract.js";
import type { RendererHostSession } from "../../host/contracts/renderer-host-session.contract.js";
import { RendererRootClaimRegistry } from "./renderer-root-claim.registry.js";
import { RendererSession } from "./renderer-session.js";

/** @description Root claims shared by every Renderer session manager in this package instance. */
const rendererRootClaims = new RendererRootClaimRegistry();

/**
 * @description Opens Renderer-owned exclusive sessions through one reusable host adapter.
 * @typeParam Root - External host root accepted when opening a session.
 * @typeParam Parent - Host value shape that can contain rendered values.
 * @typeParam Value - Concrete host value shape created by primitive capabilities.
 */
export class RendererSessionManager<Root, Parent extends object, Value extends Parent> {
    /** @description Reusable host adapter used to open exclusive root sessions. */
    readonly #host: RendererHost<Root, Parent, Value>;

    /**
     * @description Creates one manager bound to a reusable host adapter.
     * @param host - Host adapter whose root claims are shared by object identity.
     */
    constructor(host: RendererHost<Root, Parent, Value>) {
        this.#host = host;
    }

    /**
     * @description Claims one root and opens its synchronous host session.
     * @param root - External root that must not already be active for this host.
     * @returns An open Renderer-owned session wrapper.
     */
    open(root: Root): RendererSession<Parent, Value> {
        const releaseClaim = rendererRootClaims.claim(this.#host, root);

        try {
            const candidate: unknown = this.#host.open(root);

            if (!this.#isSession(candidate)) {
                throw new RendererProtocolError("open", candidate);
            }

            return new RendererSession(candidate, releaseClaim);
        } catch (error) {
            releaseClaim();
            throw error;
        }
    }

    /**
     * @description Validates the minimum synchronous host-session structure after opening.
     * @param candidate - Unknown value returned by the host adapter.
     * @returns Whether Renderer can safely own and close the session.
     */
    #isSession(candidate: unknown): candidate is RendererHostSession<Parent, Value> {
        if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
            return false;
        }

        const record = candidate as unknown as Record<PropertyKey, unknown>;

        return (
            typeof record.then !== "function" &&
            typeof record.root === "object" &&
            record.root !== null &&
            typeof record.resolvePrimitive === "function" &&
            typeof record.place === "function" &&
            typeof record.remove === "function" &&
            typeof record.close === "function"
        );
    }
}
