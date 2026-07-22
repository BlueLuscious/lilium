import { RendererProtocolError } from "../../error/runtime/renderer-protocol.error.js";
import type { RendererHostOperationType } from "../../error/types/renderer-host-operation.type.js";

/** @description Validates synchronous host results before Renderer commits private state. */
export class RendererHostProtocolValidator {
    /**
     * @description Validates one opaque object handle returned by primitive creation.
     * @typeParam Value - Opaque host value shape promised by the adapter.
     * @param candidate - Unknown primitive-creation result.
     * @returns Nothing after the candidate is narrowed to a synchronous object handle.
     */
    assertCreatedValue<Value extends object>(candidate: unknown): asserts candidate is Value {
        if (
            typeof candidate !== "object" ||
            candidate === null ||
            typeof Reflect.get(candidate, "then") === "function"
        ) {
            throw new RendererProtocolError("create", candidate);
        }
    }

    /**
     * @description Validates the required undefined result of a mutating host operation.
     * @param operation - Exact host operation being validated.
     * @param result - Unknown operation result supplied by the adapter.
     * @returns Nothing when the result satisfies the synchronous protocol.
     */
    assertVoid(operation: RendererHostOperationType, result: unknown): void {
        if (result !== undefined) {
            throw new RendererProtocolError(operation, result);
        }
    }
}
