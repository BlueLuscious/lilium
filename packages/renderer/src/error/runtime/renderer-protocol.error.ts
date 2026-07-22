import type { RendererProtocolError as RendererProtocolErrorContract } from "../contracts/renderer-protocol-error.contract.js";
import type { RendererHostOperationType } from "../types/renderer-host-operation.type.js";

/** @description Concrete failure for one invalid synchronous host operation result. */
export class RendererProtocolError extends Error implements RendererProtocolErrorContract {
    /** @description Stable error-family discriminant. */
    readonly name = "RendererProtocolError" as const;

    /** @description Host operation whose result violated the protocol. */
    readonly operation: RendererHostOperationType;

    /** @description Invalid result returned by the host operation. */
    readonly result: unknown;

    /**
     * @description Creates one structured host protocol failure.
     * @param operation - Host operation whose result violated the protocol.
     * @param result - Invalid synchronous operation result.
     */
    constructor(operation: RendererHostOperationType, result: unknown) {
        super(`Renderer host operation ${operation} returned an invalid result.`);
        this.operation = operation;
        this.result = result;
    }
}
