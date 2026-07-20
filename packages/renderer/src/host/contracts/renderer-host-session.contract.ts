import type { TemplatePrimitive } from "@lilium/template";
import type { RendererAttachmentType } from "../types/renderer-attachment.type.js";
import type { RendererPlacementType } from "../types/renderer-placement.type.js";
import type { RendererPrimitiveCapability } from "./renderer-primitive-capability.contract.js";

/**
 * @description Exclusive synchronous host session for one externally owned root.
 * @remarks Parent and value handles are opaque to Renderer. The session owns root reservation
 * and adapter state but never transfers ownership of the external root.
 * @typeParam Parent - Opaque host handle that may receive placed values.
 * @typeParam Value - Opaque host value handle created by primitive capabilities.
 */
export interface RendererHostSession<Parent extends object, Value extends Parent> {
    /** @description Opaque parent handle wrapping the claimed external root. */
    readonly root: Parent;

    /**
     * @description Resolves the host capability for one exact Template primitive identity.
     * @typeParam Primitive - Exact requested primitive identity.
     * @param primitive - Portable primitive requested during compatibility preflight.
     * @returns Its immutable host capability, or `undefined` when unsupported.
     */
    resolvePrimitive<Primitive extends TemplatePrimitive<object>>(
        primitive: Primitive,
    ): RendererPrimitiveCapability<Parent, Value, Primitive> | undefined;

    /**
     * @description Atomically inserts or moves one value to an explicit destination.
     * @param value - Live detached or attached opaque value.
     * @param destination - Destination parent and immediate sibling anchor.
     * @param current - Current parent metadata, or `undefined` while detached.
     * @returns Nothing on synchronous success.
     */
    place(
        value: Value,
        destination: RendererPlacementType<Parent, Value>,
        current: RendererAttachmentType<Parent> | undefined,
    ): void;

    /**
     * @description Atomically detaches one immediate child without releasing its handle.
     * @param value - Live attached opaque value.
     * @param current - Renderer-owned current parent metadata.
     * @returns Nothing on synchronous success.
     */
    remove(value: Value, current: RendererAttachmentType<Parent>): void;

    /**
     * @description Idempotently closes this terminal session after every value is released.
     * @returns Nothing on synchronous completion.
     */
    close(): void;
}
