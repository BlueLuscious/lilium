import type { TemplatePrimitive, TemplateProperty } from "@lilium/template";
import { RendererCompatibilityError } from "../../error/runtime/renderer-compatibility.error.js";
import { RendererProtocolError } from "../../error/runtime/renderer-protocol.error.js";
import type { RendererHostSession } from "../../host/contracts/renderer-host-session.contract.js";
import type { RendererPrimitiveCapability } from "../../host/contracts/renderer-primitive-capability.contract.js";
import type { RendererPropertyCapability } from "../../host/contracts/renderer-property-capability.contract.js";
import type { TRendererPrimitiveRequirement } from "../types/internal/renderer-primitive-requirement.type.js";
import { RendererCapabilityRegistry } from "./renderer-capability.registry.js";

/**
 * @description Validates all reachable Template capabilities before host-value mutation begins.
 * @typeParam Parent - Host value shape that can contain rendered values.
 * @typeParam Value - Concrete host value shape created by primitive capabilities.
 */
export class RendererCapabilityPreflight<Parent extends object, Value extends Parent> {
    /** @description Open host session used exclusively for synchronous capability resolution. */
    readonly #session: RendererHostSession<Parent, Value>;

    /**
     * @description Creates a preflight service for one open exclusive host session.
     * @param session - Open session used only for capability resolution during preflight.
     */
    constructor(session: RendererHostSession<Parent, Value>) {
        this.#session = session;
    }

    /**
     * @description Resolves and validates every ordered unique capability requirement.
     * @param requirements - Projection-aware requirements collected from reachable declarations.
     * @returns An immutable private lookup of accepted capabilities.
     */
    run(
        requirements: readonly TRendererPrimitiveRequirement[],
    ): RendererCapabilityRegistry<Parent, Value> {
        const primitives = new Map<
            TemplatePrimitive<object>,
            RendererPrimitiveCapability<Parent, Value, TemplatePrimitive<object>>
        >();
        const properties = new Map<
            TemplateProperty,
            RendererPropertyCapability<Value, TemplatePrimitive<object>, unknown>
        >();

        for (const requirement of requirements) {
            const capability = this.#resolvePrimitive(requirement.primitive);

            if (requirement.requiresChildren && !capability.acceptsChildren) {
                throw new RendererCompatibilityError("children-unsupported", requirement.primitive);
            }

            primitives.set(requirement.primitive, capability);

            for (const property of requirement.properties) {
                properties.set(property, this.#resolveProperty(capability, property));
            }
        }

        return new RendererCapabilityRegistry(primitives, properties);
    }

    /**
     * @description Resolves and structurally validates one exact primitive capability.
     * @param primitive - Required portable primitive identity.
     * @returns Its valid host capability.
     */
    #resolvePrimitive(
        primitive: TemplatePrimitive<object>,
    ): RendererPrimitiveCapability<Parent, Value, TemplatePrimitive<object>> {
        const candidate: unknown = this.#session.resolvePrimitive(primitive);

        if (candidate === undefined) {
            throw new RendererCompatibilityError("missing-primitive", primitive);
        }

        if (
            !this.#isRecord(candidate) ||
            this.#isPromiseLike(candidate) ||
            typeof candidate.acceptsChildren !== "boolean" ||
            typeof candidate.create !== "function" ||
            typeof candidate.resolveProperty !== "function" ||
            typeof candidate.release !== "function"
        ) {
            throw new RendererProtocolError("resolve-primitive", candidate);
        }

        if (candidate.primitive !== primitive) {
            throw new RendererCompatibilityError("primitive-mismatch", primitive);
        }

        return candidate as unknown as RendererPrimitiveCapability<
            Parent,
            Value,
            TemplatePrimitive<object>
        >;
    }

    /**
     * @description Resolves and structurally validates one exact property capability.
     * @param primitive - Valid capability for the property's owning primitive.
     * @param property - Required exact Template property identity.
     * @returns Its valid host property capability.
     */
    #resolveProperty(
        primitive: RendererPrimitiveCapability<Parent, Value, TemplatePrimitive<object>>,
        property: TemplateProperty,
    ): RendererPropertyCapability<Value, TemplatePrimitive<object>, unknown> {
        const candidate: unknown = primitive.resolveProperty(property);

        if (candidate === undefined) {
            throw new RendererCompatibilityError("missing-property", property);
        }

        if (
            !this.#isRecord(candidate) ||
            this.#isPromiseLike(candidate) ||
            typeof candidate.write !== "function"
        ) {
            throw new RendererProtocolError("resolve-property", candidate);
        }

        if (candidate.property !== property) {
            throw new RendererCompatibilityError("property-mismatch", property);
        }

        return candidate as unknown as RendererPropertyCapability<
            Value,
            TemplatePrimitive<object>,
            unknown
        >;
    }

    /**
     * @description Determines whether a candidate is a non-array object record.
     * @param candidate - Unknown host-provided value.
     * @returns Whether property inspection is safe.
     */
    #isRecord(candidate: unknown): candidate is Record<PropertyKey, unknown> {
        return typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);
    }

    /**
     * @description Determines whether a candidate exposes Promise-like continuation behavior.
     * @param candidate - Unknown host-provided value.
     * @returns Whether the candidate is invalid asynchronous protocol output.
     */
    #isPromiseLike(candidate: Record<PropertyKey, unknown>): boolean {
        return typeof candidate.then === "function";
    }
}
