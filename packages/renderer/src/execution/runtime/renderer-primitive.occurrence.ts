import type { Scope } from "@lilium/core";
import type { TemplatePrimitive } from "@lilium/template";
import type { RendererPrimitiveCapability } from "../../host/contracts/renderer-primitive-capability.contract.js";
import type { RendererHostProtocolValidator } from "../../host/runtime/renderer-host-protocol.validator.js";
import type { RendererAttachmentType } from "../../host/types/renderer-attachment.type.js";
import type { RendererSession } from "../../session/runtime/renderer-session.js";
import { RendererCleanupCollector } from "../../shared/runtime/renderer-cleanup.collector.js";
import type { IRendererPlaceableOccurrence } from "../contracts/internal/renderer-placeable-occurrence.contract.js";

/**
 * @description Owns one created opaque host value and its current Renderer attachment metadata.
 * @typeParam Parent - Host value shape that can contain rendered values.
 * @typeParam Value - Concrete opaque host value shape owned by this occurrence.
 */
export class RendererPrimitiveOccurrence<Parent extends object, Value extends Parent>
    implements IRendererPlaceableOccurrence<Parent, Value>
{
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
    /** @description Whether this host handle has entered irreversible terminal cleanup. */
    #disposed = false;
    /** @description Whether permanent host release has already been attempted. */
    #released = false;

    /**
     * @description Creates private ownership metadata for one successfully created host value.
     * @param reference - Normalized node reference inside its Template definition.
     * @param session - Ready Renderer session that owns host operations.
     * @param protocol - Shared validator for synchronous host results.
     * @param capability - Primitive capability that created the value.
     * @param value - Stable opaque value returned by the capability.
     * @param owner - Scope receiving immediate partial-construction cleanup ownership.
     */
    constructor(
        reference: number,
        session: RendererSession<Parent, Value>,
        protocol: RendererHostProtocolValidator,
        capability: RendererPrimitiveCapability<Parent, Value, TemplatePrimitive<object>>,
        value: Value,
        owner: Scope,
    ) {
        this.#reference = reference;
        this.#session = session;
        this.#protocol = protocol;
        this.#capability = capability;
        this.#value = value;
        owner.cleanup(() => {
            this.dispose();
            return undefined;
        });
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
     * @description Returns whether this primitive handle has become terminal.
     * @returns Whether removal and release have already begun.
     */
    get disposed(): boolean {
        return this.#disposed;
    }

    /**
     * @description Returns the single host root represented by this primitive occurrence.
     * @returns Always one.
     */
    get size(): number {
        return 1;
    }

    /**
     * @description Detaches and permanently releases this host value exactly once.
     * @remarks Terminal state commits before host callbacks so reentrant disposal is harmless.
     * Every applicable operation is attempted even when an earlier cleanup operation fails.
     * @returns Nothing after deterministic cleanup, or throws collected host failures.
     */
    dispose(): void {
        if (this.#released) {
            return;
        }

        this.#disposed = true;
        const cleanup = new RendererCleanupCollector();
        cleanup.attempt(() => this.detach());
        cleanup.attempt(() => this.release());
        cleanup.throwIfAny("Renderer primitive removal and release failed.");
    }

    /**
     * @description Atomically detaches this value while retaining its terminal handle for release.
     * @returns Nothing when detached or already detached.
     */
    detach(): void {
        if (this.#released) {
            return;
        }

        this.#disposed = true;
        const attachment = this.#attachment;
        if (attachment !== undefined) {
            this.#attachment = undefined;
            const result: unknown = this.#session.host.remove(this.#value, attachment);
            this.#protocol.assertVoid("remove", result);
        }
    }

    /**
     * @description Permanently releases this terminal host handle exactly once.
     * @returns Nothing after the host release attempt completes.
     */
    release(): void {
        if (this.#released) {
            return;
        }

        this.#disposed = true;
        this.#released = true;
        const result: unknown = this.#capability.release(this.#value);
        this.#protocol.assertVoid("release", result);
    }

    /**
     * @description Inserts or moves this value to one explicit host destination atomically.
     * @param parent - Destination immediate parent handle.
     * @param before - Destination sibling anchor, or null for the ordered end.
     * @returns Nothing after host placement and metadata commit succeed.
     */
    place(parent: Parent, before: Value | null): void {
        if (this.#disposed) {
            throw new Error("Cannot place a disposed Renderer primitive occurrence.");
        }

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
