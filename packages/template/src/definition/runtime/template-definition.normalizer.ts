import type { TemplateBinding } from "../../binding/contracts/template-binding.contract.js";
import type { TemplateNode } from "../../primitive/contracts/template-node.contract.js";
import type { TemplatePrimitive } from "../../primitive/contracts/template-primitive.contract.js";
import type { TemplatePropertyInstructionType } from "../../primitive/types/template-property-instruction.type.js";
import type { TemplateDefinition } from "../contracts/template-definition.contract.js";
import type { TTemplateNormalizationContext } from "../types/internal/template-normalization-context.type.js";
import type { TemplateDefinitionOptionsType } from "../types/template-definition-options.type.js";
import type { TemplateReferenceType } from "../types/template-reference.type.js";
import type { TemplateDeclarationFactory } from "./template-declaration.factory.js";

/**
 * @description Internal validator and deterministic copier for complete template definitions.
 * @remarks Every normalization owns fresh immutable declaration containers while preserving
 * primitive, property, function, and application value references supplied by the caller.
 */
export class TemplateDefinitionNormalizer {
    /** @description Factory validating genuine unnormalized declarations. */
    readonly #declarations: TemplateDeclarationFactory;

    /** @description Genuine normalized template definitions created by this normalizer. */
    readonly #definitions = new WeakSet<object>();

    /**
     * @description Constructs one normalizer over the package declaration factory.
     * @param declarations - Factory validating genuine declaration identities.
     */
    constructor(declarations: TemplateDeclarationFactory) {
        this.#declarations = declarations;
    }

    /**
     * @description Validates, copies, references, and freezes one complete template program.
     * @typeParam State - Read-only object supplied to each Renderer occurrence.
     * @param definition - Caller-owned root declaration record.
     * @returns A genuine reusable normalized template definition.
     */
    define<State extends object>(
        definition: TemplateDefinitionOptionsType<State>,
    ): TemplateDefinition<State> {
        this.#assertDefinitionRecord(definition);
        const candidateRoots = Reflect.get(definition, "roots");

        if (!Array.isArray(candidateRoots)) {
            throw new TypeError("A template definition must expose a roots array.");
        }

        const context: TTemplateNormalizationContext = {
            active: new WeakSet<object>(),
            nextReference: 0,
        };
        const roots = Object.freeze(
            candidateRoots.map((node) => this.#normalizeNode<State>(node, context)),
        );
        const normalized = Object.freeze({ roots }) as unknown as TemplateDefinition<State>;
        this.#definitions.add(normalized);
        return normalized;
    }

    /**
     * @description Verifies that a candidate is a genuine normalized template definition.
     * @param definition - Candidate supplied to a later composition operation.
     * @returns Nothing.
     */
    assertDefinition(definition: unknown): asserts definition is TemplateDefinition<object> {
        if (
            typeof definition !== "object" ||
            definition === null ||
            !this.#definitions.has(definition)
        ) {
            throw new TypeError("A template definition must be a genuine Template definition.");
        }
    }

    /**
     * @description Copies one genuine node and recursively normalizes its property and child declarations.
     * @typeParam State - Read-only template occurrence state.
     * @param candidate - Unnormalized node candidate from a fragment.
     * @param context - State isolated to the active definition normalization pass.
     * @returns A frozen normalized node with deterministic references.
     */
    #normalizeNode<State extends object>(
        candidate: unknown,
        context: TTemplateNormalizationContext,
    ): TemplateNode<State, TemplatePrimitive<object>, TemplateReferenceType> {
        this.#declarations.assertNode(candidate);

        if (context.active.has(candidate)) {
            throw new TypeError("A template definition cannot contain cyclic declarations.");
        }

        context.active.add(candidate);

        try {
            const reference = context.nextReference;
            context.nextReference += 1;
            const properties = Object.freeze(
                candidate.properties.map((instruction) =>
                    this.#normalizeProperty<State>(
                        instruction,
                        candidate.primitive,
                        reference,
                        context,
                    ),
                ),
            );
            const children = Object.freeze(
                candidate.children.map((child) => this.#normalizeNode<State>(child, context)),
            );

            return Object.freeze({
                kind: "node" as const,
                reference,
                primitive: candidate.primitive,
                properties,
                children,
            });
        } finally {
            context.active.delete(candidate);
        }
    }

    /**
     * @description Copies one genuine property instruction and assigns binding references.
     * @typeParam State - Read-only template occurrence state.
     * @param instruction - Genuine static value or dynamic binding declaration.
     * @param primitive - Primitive identity required to own the instruction property.
     * @param target - Definition-local reference of the containing primitive node.
     * @param context - State isolated to the active definition normalization pass.
     * @returns A frozen normalized property instruction.
     */
    #normalizeProperty<State extends object>(
        instruction: unknown,
        primitive: TemplatePrimitive<object>,
        target: TemplateReferenceType,
        context: TTemplateNormalizationContext,
    ): TemplatePropertyInstructionType<State, TemplatePrimitive<object>, TemplateReferenceType> {
        if (this.#declarations.isValue(instruction)) {
            if (instruction.property.primitive !== primitive) {
                throw new TypeError(
                    "A template node property must belong to its primitive identity.",
                );
            }

            return Object.freeze({
                kind: "value" as const,
                property: instruction.property,
                value: instruction.value,
            });
        }

        if (this.#declarations.isBinding(instruction)) {
            if (instruction.property.primitive !== primitive) {
                throw new TypeError(
                    "A template node property must belong to its primitive identity.",
                );
            }

            const reference = context.nextReference;
            context.nextReference += 1;
            return Object.freeze({
                kind: "binding" as const,
                reference,
                target,
                property: instruction.property,
                evaluate: instruction.evaluate,
                equal: instruction.equal,
            }) as TemplateBinding<State, TemplatePrimitive<object>, unknown, TemplateReferenceType>;
        }

        throw new TypeError(
            "A template node property must be a genuine value or binding declaration.",
        );
    }

    /**
     * @description Verifies one definition candidate is a non-array record.
     * @param definition - Caller value supplied to `Template.define()`.
     * @returns Nothing.
     */
    #assertDefinitionRecord(definition: unknown): asserts definition is object {
        if (typeof definition !== "object" || definition === null || Array.isArray(definition)) {
            throw new TypeError("A template definition must be a non-array object.");
        }
    }
}
