import type { TemplateBinding } from "../../binding/contracts/template-binding.contract.js";
import type { TemplateComponent } from "../../component/contracts/template-component.contract.js";
import type { TemplateComponentInputType } from "../../component/types/template-component-input.type.js";
import type { TemplateNode } from "../../primitive/contracts/template-node.contract.js";
import type { TemplatePrimitive } from "../../primitive/contracts/template-primitive.contract.js";
import type { TemplatePropertyInstructionType } from "../../primitive/types/template-property-instruction.type.js";
import type { TemplateDefinition } from "../contracts/template-definition.contract.js";
import type { TTemplateNormalizationContext } from "../types/internal/template-normalization-context.type.js";
import type { TemplateDefinitionOptionsType } from "../types/template-definition-options.type.js";
import type { TemplateInstructionType } from "../types/template-instruction.type.js";
import type { TemplateReferenceType } from "../types/template-reference.type.js";
import type { TemplateDeclarationFactory } from "./template-declaration.factory.js";
import type { TemplateDefinitionRegistry } from "./template-definition.registry.js";

/**
 * @description Internal validator and deterministic copier for complete template definitions.
 * @remarks Every normalization owns fresh immutable declaration containers while preserving
 * primitive, property, function, and application value references supplied by the caller.
 */
export class TemplateDefinitionNormalizer {
    /** @description Factory validating genuine unnormalized declarations. */
    readonly #declarations: TemplateDeclarationFactory;

    /** @description Registry receiving each genuine normalized definition identity. */
    readonly #definitions: TemplateDefinitionRegistry;

    /**
     * @description Constructs one normalizer over the package declaration factory.
     * @param declarations - Factory validating genuine declaration identities.
     * @param definitions - Registry receiving normalized definition identities.
     */
    constructor(declarations: TemplateDeclarationFactory, definitions: TemplateDefinitionRegistry) {
        this.#declarations = declarations;
        this.#definitions = definitions;
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
            candidateRoots.map((instruction) =>
                this.#normalizeInstruction<State>(instruction, context),
            ),
        );
        const normalized = Object.freeze({ roots }) as unknown as TemplateDefinition<State>;
        this.#definitions.register(normalized);
        return normalized;
    }

    /**
     * @description Dispatches one genuine unnormalized instruction to its feature normalizer.
     * @typeParam State - Read-only template occurrence state.
     * @param candidate - Unnormalized instruction candidate from a fragment.
     * @param context - State isolated to the active definition normalization pass.
     * @returns A frozen normalized instruction with a deterministic reference.
     */
    #normalizeInstruction<State extends object>(
        candidate: unknown,
        context: TTemplateNormalizationContext,
    ): TemplateInstructionType<State> {
        if (this.#declarations.isNode(candidate)) {
            return this.#normalizeNode<State>(candidate, context);
        }

        if (this.#declarations.isComponent(candidate)) {
            return this.#normalizeComponent<State>(candidate, context);
        }

        throw new TypeError("A template fragment can contain only genuine Template declarations.");
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
                candidate.children.map((child) =>
                    this.#normalizeInstruction<State>(child, context),
                ),
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
     * @description Copies one genuine nested component and its complete-input declaration.
     * @typeParam State - Read-only parent template occurrence state.
     * @param candidate - Genuine unnormalized nested component declaration.
     * @param context - State isolated to the active definition normalization pass.
     * @returns A frozen normalized nested component instruction.
     */
    #normalizeComponent<State extends object>(
        candidate: TemplateComponent<object, undefined>,
        context: TTemplateNormalizationContext,
    ): TemplateComponent<State, TemplateReferenceType> {
        const reference = context.nextReference;
        context.nextReference += 1;
        const inputs = this.#normalizeComponentInputs<State>(candidate.inputs);

        return Object.freeze({
            kind: "component" as const,
            reference,
            component: candidate.component,
            inputs,
            projections: Object.freeze([]),
        });
    }

    /**
     * @description Copies one static or dynamic complete component input declaration.
     * @typeParam State - Read-only parent template occurrence state.
     * @param inputs - Genuine discriminated component input declaration.
     * @returns A frozen normalized input declaration retaining application values or evaluator.
     */
    #normalizeComponentInputs<State extends object>(
        inputs: TemplateComponentInputType<object, object>,
    ): TemplateComponentInputType<State, object> {
        if (inputs.kind === "binding") {
            return Object.freeze({
                kind: "binding" as const,
                evaluate: inputs.evaluate,
            });
        }

        return Object.freeze({
            kind: "value" as const,
            value: Object.freeze({ ...inputs.value }),
        });
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
