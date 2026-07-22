import type {
    TemplateDefinition,
    TemplateFragmentType,
    TemplateNode,
    TemplatePrimitive,
} from "@lilium/template";
import { RendererHostProtocolValidator } from "../../host/runtime/renderer-host-protocol.validator.js";
import type { RendererSession } from "../../session/runtime/renderer-session.js";
import { RendererFragmentOccurrence } from "./renderer-fragment.occurrence.js";
import { RendererPrimitiveOccurrence } from "./renderer-primitive.occurrence.js";
import { RendererTemplateOccurrence } from "./renderer-template.occurrence.js";

/**
 * @description Executes normalized static Template instructions through one ready Renderer session.
 * @typeParam Parent - Host value shape that can contain rendered values.
 * @typeParam Value - Concrete opaque host value shape created by primitive capabilities.
 */
export class RendererInstructionExecutor<Parent extends object, Value extends Parent> {
    /** @description Ready session whose preflight and host operations constrain execution. */
    readonly #session: RendererSession<Parent, Value>;
    /** @description Shared validator for synchronous host mutation results. */
    readonly #protocol: RendererHostProtocolValidator = new RendererHostProtocolValidator();

    /**
     * @description Creates one static instruction executor for a ready Renderer session.
     * @param session - Session already preflighted for the definition that will execute.
     */
    constructor(session: RendererSession<Parent, Value>) {
        this.#session = session;
    }

    /**
     * @description Constructs a static Template detached and then places its roots explicitly.
     * @typeParam State - Read-only state retained by the Template occurrence.
     * @param definition - Exact normalized Template identity accepted during preflight.
     * @param state - Exact application state retained for later reactive integration.
     * @returns Private Template occurrence owning every created host value.
     */
    executeTemplate<State extends object>(
        definition: TemplateDefinition<State>,
        state: State,
    ): RendererTemplateOccurrence<State, Parent, Value> {
        this.#session.assertPreflighted(definition);
        this.#assertStaticFragment(definition.roots);

        const primitives = new Map<number, RendererPrimitiveOccurrence<Parent, Value>>();
        const roots = this.#constructFragment(definition.roots, primitives);
        const occurrence = new RendererTemplateOccurrence(state, roots, primitives);

        occurrence.place(this.#session.host.root, null);
        return occurrence;
    }

    /**
     * @description Constructs every primitive root in one fragment without placing the fragment.
     * @typeParam State - Read-only state associated with the enclosing Template occurrence.
     * @param fragment - Ordered normalized primitive declarations.
     * @param primitives - Mutable occurrence index owned by the enclosing Template execution.
     * @returns Ordered detached fragment occurrence.
     */
    #constructFragment<State extends object>(
        fragment: TemplateFragmentType<State>,
        primitives: Map<number, RendererPrimitiveOccurrence<Parent, Value>>,
    ): RendererFragmentOccurrence<Parent, Value> {
        const roots: RendererPrimitiveOccurrence<Parent, Value>[] = [];

        for (const instruction of fragment) {
            if (instruction.kind !== "node") {
                throw new TypeError("Static instruction execution accepts only primitive nodes.");
            }

            roots.push(this.#constructNode(instruction, primitives));
        }

        return new RendererFragmentOccurrence(roots);
    }

    /**
     * @description Creates one detached primitive, applies static values, and places its children.
     * @typeParam State - Read-only state associated with the enclosing Template occurrence.
     * @param node - Normalized primitive node declaration.
     * @param primitives - Mutable occurrence index owned by the enclosing Template execution.
     * @returns Primitive occurrence owning the created host handle.
     */
    #constructNode<State extends object>(
        node: TemplateNode<State, TemplatePrimitive<object>, number>,
        primitives: Map<number, RendererPrimitiveOccurrence<Parent, Value>>,
    ): RendererPrimitiveOccurrence<Parent, Value> {
        if (primitives.has(node.reference)) {
            throw new TypeError("A Template primitive reference can be instantiated only once.");
        }

        const capability = this.#session.capabilities.primitive(node.primitive);
        const candidate: unknown = capability.create();
        this.#protocol.assertCreatedValue<Value>(candidate);

        const occurrence = new RendererPrimitiveOccurrence(
            node.reference,
            this.#session,
            this.#protocol,
            capability,
            candidate,
        );
        primitives.set(node.reference, occurrence);

        for (const property of node.properties) {
            if (property.kind === "value") {
                const propertyCapability = this.#session.capabilities.property(property.property);
                const result: unknown = propertyCapability.write(candidate, property.value);
                this.#protocol.assertVoid("write", result);
            }
        }

        const children = this.#constructFragment(node.children, primitives);
        children.place(candidate, null);
        return occurrence;
    }

    /**
     * @description Rejects Component and outlet instructions before any host value is created.
     * @typeParam State - Read-only state associated with the enclosing Template occurrence.
     * @param fragment - Normalized fragment to validate recursively.
     * @returns Nothing when every reachable instruction is a primitive node.
     */
    #assertStaticFragment<State extends object>(fragment: TemplateFragmentType<State>): void {
        for (const instruction of fragment) {
            if (instruction.kind !== "node") {
                throw new TypeError(
                    "Component and outlet execution requires Renderer reactive integration.",
                );
            }

            this.#assertStaticFragment(instruction.children);
        }
    }
}
