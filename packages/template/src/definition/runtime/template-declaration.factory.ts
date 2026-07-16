import type { TemplateBinding } from "../../binding/contracts/template-binding.contract.js";
import type { TemplateBindingEvaluatorType } from "../../binding/types/template-binding-evaluator.type.js";
import type { TemplateBindingOptionsType } from "../../binding/types/template-binding-options.type.js";
import type { TemplateNode } from "../../primitive/contracts/template-node.contract.js";
import type { TemplatePrimitive } from "../../primitive/contracts/template-primitive.contract.js";
import type { TemplateProperty } from "../../primitive/contracts/template-property.contract.js";
import type { TemplateStaticValue } from "../../primitive/contracts/template-static-value.contract.js";
import type { TemplateIdentityRegistry } from "../../primitive/runtime/template-identity.registry.js";
import type { TemplateNodeOptionsType } from "../../primitive/types/template-node-options.type.js";
import type { TemplatePropertyInstructionType } from "../../primitive/types/template-property-instruction.type.js";

/**
 * @description Internal factory for genuine frozen unnormalized Template declaration records.
 * @remarks It copies caller-owned arrays and validates identity relationships without evaluating
 * dynamic binding functions or retaining declaration option objects.
 */
export class TemplateDeclarationFactory {
    /** @description Registry validating primitive and property capability identities. */
    readonly #identities: TemplateIdentityRegistry;

    /** @description Genuine dynamic binding declarations created by this factory. */
    readonly #bindings = new WeakSet<object>();

    /** @description Genuine primitive node declarations created by this factory. */
    readonly #nodes = new WeakSet<object>();

    /** @description Genuine static value declarations created by this factory. */
    readonly #values = new WeakSet<object>();

    /**
     * @description Constructs one declaration factory over the package identity registry.
     * @param identities - Registry validating primitive and property capabilities.
     */
    constructor(identities: TemplateIdentityRegistry) {
        this.#identities = identities;
    }

    /**
     * @description Creates one frozen static property value declaration.
     * @typeParam Primitive - Primitive identity that owns the property.
     * @typeParam Value - Static value accepted by the property.
     * @param property - Genuine typed property identity.
     * @param value - Application value retained by reference.
     * @returns An immutable genuine static value declaration.
     */
    createValue<Primitive extends TemplatePrimitive<object>, Value>(
        property: TemplateProperty<Primitive, Value>,
        value: Value,
    ): TemplateStaticValue<Primitive, Value> {
        this.#identities.assertProperty(property);
        const declaration = Object.freeze({
            kind: "value" as const,
            property,
            value,
        });
        this.#values.add(declaration);
        return declaration;
    }

    /**
     * @description Creates one frozen lazy dynamic property binding declaration.
     * @typeParam Primitive - Primitive identity that owns the property.
     * @typeParam Value - Evaluated property value type.
     * @typeParam State - Read-only template occurrence state.
     * @param property - Genuine typed property identity.
     * @param evaluate - Pure synchronous evaluator retained without execution.
     * @param options - Optional equality behavior copied from caller input.
     * @returns An immutable genuine unnormalized binding declaration.
     */
    createBinding<
        Primitive extends TemplatePrimitive<object>,
        Value,
        State extends object = object,
    >(
        property: TemplateProperty<Primitive, Value>,
        evaluate: TemplateBindingEvaluatorType<State, Value>,
        options?: TemplateBindingOptionsType<Value>,
    ): TemplateBinding<State, Primitive, Value, undefined> {
        this.#identities.assertProperty(property);

        if (typeof evaluate !== "function") {
            throw new TypeError("A template binding evaluator must be a function.");
        }

        this.#assertOptionalRecord(options, "binding options");
        const candidate = options === undefined ? undefined : Reflect.get(options, "equal");

        if (candidate !== undefined && typeof candidate !== "function") {
            throw new TypeError("A template binding equality operation must be a function.");
        }

        const declaration = Object.freeze({
            kind: "binding" as const,
            reference: undefined,
            target: undefined,
            property,
            evaluate,
            equal: candidate ?? Object.is,
        }) as TemplateBinding<State, Primitive, Value, undefined>;
        this.#bindings.add(declaration);
        return declaration;
    }

    /**
     * @description Creates one frozen primitive node with copied declaration arrays.
     * @typeParam State - Read-only template occurrence state.
     * @typeParam Primitive - Genuine portable primitive identity.
     * @param primitive - Primitive capability represented by this node.
     * @param options - Optional property and child declaration arrays.
     * @returns An immutable genuine unnormalized primitive node.
     */
    createNode<
        State extends object = object,
        Primitive extends TemplatePrimitive<object> = TemplatePrimitive<object>,
    >(
        primitive: Primitive,
        options?: TemplateNodeOptionsType<State, Primitive>,
    ): TemplateNode<State, Primitive, undefined> {
        this.#identities.assertPrimitive(primitive);
        this.#assertOptionalRecord(options, "node options");
        const propertyCandidates = this.#readArray(options, "properties");
        const childCandidates = this.#readArray(options, "children");

        for (const instruction of propertyCandidates) {
            this.#assertPropertyInstruction(instruction, primitive);
        }

        for (const child of childCandidates) {
            this.assertNode(child);
        }

        const properties = Object.freeze([
            ...propertyCandidates,
        ]) as readonly TemplatePropertyInstructionType<State, Primitive, undefined>[];
        const children = Object.freeze([...childCandidates]) as readonly TemplateNode<
            State,
            TemplatePrimitive<object>,
            undefined
        >[];
        const declaration = Object.freeze({
            kind: "node" as const,
            reference: undefined,
            primitive,
            properties,
            children,
        }) as TemplateNode<State, Primitive, undefined>;
        this.#nodes.add(declaration);
        return declaration;
    }

    /**
     * @description Verifies that a candidate is a genuine unnormalized primitive node.
     * @param node - Candidate encountered during declaration creation or normalization.
     * @returns Nothing.
     */
    assertNode(
        node: unknown,
    ): asserts node is TemplateNode<object, TemplatePrimitive<object>, undefined> {
        if (typeof node !== "object" || node === null || !this.#nodes.has(node)) {
            throw new TypeError(
                "A template fragment can contain only genuine Template declarations.",
            );
        }
    }

    /**
     * @description Reports whether a candidate is a genuine static value declaration.
     * @param value - Candidate property instruction encountered during normalization.
     * @returns Whether the candidate was created by this declaration factory.
     */
    isValue(value: unknown): value is TemplateStaticValue {
        return typeof value === "object" && value !== null && this.#values.has(value);
    }

    /**
     * @description Reports whether a candidate is a genuine dynamic binding declaration.
     * @param value - Candidate property instruction encountered during normalization.
     * @returns Whether the candidate was created by this declaration factory.
     */
    isBinding(value: unknown): value is TemplateBinding<object> {
        return typeof value === "object" && value !== null && this.#bindings.has(value);
    }

    /**
     * @description Validates one genuine property declaration and primitive ownership.
     * @param instruction - Candidate static value or dynamic binding declaration.
     * @param primitive - Primitive identity required to own its property.
     * @returns Nothing.
     */
    #assertPropertyInstruction(instruction: unknown, primitive: TemplatePrimitive<object>): void {
        if (!this.isValue(instruction) && !this.isBinding(instruction)) {
            throw new TypeError(
                "A template node property must be a genuine value or binding declaration.",
            );
        }

        if (instruction.property.primitive !== primitive) {
            throw new TypeError("A template node property must belong to its primitive identity.");
        }
    }

    /**
     * @description Reads and copies one optional declaration array from an options record.
     * @param options - Optional caller-owned options record.
     * @param key - Array property to read.
     * @returns A shallow copy of the supplied array or a new empty array.
     */
    #readArray(options: object | undefined, key: string): unknown[] {
        if (options === undefined) {
            return [];
        }

        const candidate = Reflect.get(options, key);

        if (candidate === undefined) {
            return [];
        }

        if (!Array.isArray(candidate)) {
            throw new TypeError(`Template node ${key} must be an array.`);
        }

        return [...candidate];
    }

    /**
     * @description Verifies one optional caller value is a non-array options record.
     * @param value - Optional candidate supplied to a declaration operation.
     * @param description - Options family used in deterministic validation errors.
     * @returns Nothing.
     */
    #assertOptionalRecord(
        value: unknown,
        description: string,
    ): asserts value is object | undefined {
        if (
            value !== undefined &&
            (typeof value !== "object" || value === null || Array.isArray(value))
        ) {
            throw new TypeError(`Template ${description} must be a non-array object.`);
        }
    }
}
