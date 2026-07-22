import type { TemplatePrimitive } from "@lilium/template";
import type { RendererPrimitiveCapability } from "../../host/contracts/renderer-primitive-capability.contract.js";
import type { RendererHostProtocolValidator } from "../../host/runtime/renderer-host-protocol.validator.js";
import type { RendererAttachmentType } from "../../host/types/renderer-attachment.type.js";
import type { RendererSession } from "../../session/runtime/renderer-session.js";

/**
 * @description Owns one created opaque host value and its current Renderer attachment metadata.
 * @typeParam Parent - Host value shape that can contain rendered values.
 * @typeParam Value - Concrete opaque host value shape owned by this occurrence.
 */
export class RendererPrimitiveOccurrence<Parent extends object, Value extends Parent> {
    /** @description Normalized definition-local identity of the represented primitive node. */
    readonly #reference: number;
    /** @description Session that exclusively owns every operation for this host value. */
    readonly #session: RendererSession<Parent, Value>;
    /** @description Shared validator for synchronous host placement results. */
    readonly #protocol: RendererHostProtocolValidator;
    /** @description Capability that created and will eventually release the host value. */
    readonly #capability: RendererPrimitiveCapability<Parent, Value, TemplatePrimitive<object>>;
    /** @description Stable opaque host value owned until terminal release. */
    readonly #value: Value;
    /** @description Current immediate host parent, or undefined while detached. */
    #attachment: RendererAttachmentType<Parent> | undefined;

    /**
     * @description Creates private ownership metadata for one successfully created host value.
     * @param reference - Normalized node reference inside its Template definition.
     * @param session - Ready Renderer session that owns host operations.
     * @param protocol - Shared validator for synchronous host results.
     * @param capability - Primitive capability that created the value.
     * @param value - Stable opaque value returned by the capability.
     */
    constructor(
        reference: number,
        session: RendererSession<Parent, Value>,
        protocol: RendererHostProtocolValidator,
        capability: RendererPrimitiveCapability<Parent, Value, TemplatePrimitive<object>>,
        value: Value,
    ) {
        this.#reference = reference;
        this.#session = session;
        this.#protocol = protocol;
        this.#capability = capability;
        this.#value = value;
    }

    /**
     * @description Returns the normalized node reference owned by this occurrence.
     * @returns Definition-local primitive node reference.
     */
    get reference(): number {
        return this.#reference;
    }

    /**
     * @description Returns the stable opaque handle for private execution composition.
     * @returns Host value owned by this occurrence.
     */
    get value(): Value {
        return this.#value;
    }

    /**
     * @description Returns whether the value currently has a Renderer-owned host parent.
     * @returns Whether placement metadata is present.
     */
    get attached(): boolean {
        return this.#attachment !== undefined;
    }

    /**
     * @description Inserts or moves this value to one explicit host destination atomically.
     * @param parent - Destination immediate parent handle.
     * @param before - Destination sibling anchor, or null for the ordered end.
     * @returns Nothing after host placement and metadata commit succeed.
     */
    place(parent: Parent, before: Value | null): void {
        if (before === this.#value) {
            throw new TypeError("A Renderer value cannot be placed before itself.");
        }

        const result: unknown = this.#session.host.place(
            this.#value,
            { parent, before },
            this.#attachment,
        );
        this.#protocol.assertVoid("place", result);
        this.#attachment = Object.freeze({ parent });
    }

    /**
     * @description Returns the capability retained for future terminal release.
     * @returns Exact primitive capability that created this occurrence value.
     */
    get capability(): RendererPrimitiveCapability<Parent, Value, TemplatePrimitive<object>> {
        return this.#capability;
    }
}
