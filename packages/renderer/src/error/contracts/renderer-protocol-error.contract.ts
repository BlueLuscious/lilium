import type { RendererHostOperationType } from "../types/renderer-host-operation.type.js";

/**
 * @description Structured failure produced when a host violates the synchronous protocol.
 * @remarks Adapter-thrown errors remain opaque and are not converted into this contract. This
 * error represents invalid operation results such as Promise-like or non-undefined success values.
 */
export interface RendererProtocolError extends Error {
    /** @description Stable error-family discriminant. */
    readonly name: "RendererProtocolError";

    /** @description Host operation whose result violated the protocol. */
    readonly operation: RendererHostOperationType;

    /** @description Invalid result returned by the host operation. */
    readonly result: unknown;
}
