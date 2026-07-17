import type { ComponentInputValuesType } from "@lilium/component";
import type { TemplateBinding } from "../../binding/contracts/template-binding.contract.js";
import type { TemplateBindingEvaluatorType } from "../../binding/types/template-binding-evaluator.type.js";
import type { TemplateBindingOptionsType } from "../../binding/types/template-binding-options.type.js";
import type { TemplateComponent } from "../../component/contracts/template-component.contract.js";
import type { TemplateComponentInputBinding } from "../../component/contracts/template-component-input-binding.contract.js";
import type { TemplateComponentInputValue } from "../../component/contracts/template-component-input-value.contract.js";
import type { TemplatedComponentDefinition } from "../../component/contracts/templated-component-definition.contract.js";
import type { TemplateComponentInputType } from "../../component/types/template-component-input.type.js";
import type { TemplateComponentInputEvaluatorType } from "../../component/types/template-component-input-evaluator.type.js";
import type { TemplateComponentOptionsType } from "../../component/types/template-component-options.type.js";
import type { TemplateNode } from "../../primitive/contracts/template-node.contract.js";
import type { TemplatePrimitive } from "../../primitive/contracts/template-primitive.contract.js";
import type { TemplateProperty } from "../../primitive/contracts/template-property.contract.js";
import type { TemplateStaticValue } from "../../primitive/contracts/template-static-value.contract.js";
import type { TemplateIdentityRegistry } from "../../primitive/runtime/template-identity.registry.js";
import type { TemplateNodeOptionsType } from "../../primitive/types/template-node-options.type.js";
import type { TemplatePropertyInstructionType } from "../../primitive/types/template-property-instruction.type.js";
import type { TemplateOutlet } from "../../slot/contracts/template-outlet.contract.js";
import type { TemplateSlot } from "../../slot/contracts/template-slot.contract.js";
import type { TemplateProjectionFactory } from "../../slot/runtime/template-projection.factory.js";
import type { TemplateSlotRegistry } from "../../slot/runtime/template-slot.registry.js";
import type { TemplateOutletOptionsType } from "../../slot/types/template-outlet-options.type.js";
import type { TemplateInstructionType } from "../types/template-instruction.type.js";

/**
 * @description Internal factory for genuine frozen unnormalized Template declaration records.
 * @remarks It copies caller-owned arrays and validates identity relationships without evaluating
 * dynamic binding functions or retaining declaration option objects.
 */
export class TemplateDeclarationFactory {
    /** @description Registry validating primitive and property capability identities. */
    readonly #identities: TemplateIdentityRegistry;

    /** @description Factory validating and copying component projection declarations. */
    readonly #projections: TemplateProjectionFactory;

    /** @description Registry validating slot identities used by outlets. */
    readonly #slots: TemplateSlotRegistry;

    /** @description Genuine dynamic binding declarations created by this factory. */
    readonly #bindings = new WeakSet<object>();

    /** @description Genuine nested component declarations created by this factory. */
    readonly #components = new WeakSet<object>();

    /** @description Genuine primitive node declarations created by this factory. */
    readonly #nodes = new WeakSet<object>();

    /** @description Genuine slot outlet declarations created by this factory. */
    readonly #outlets = new WeakSet<object>();

    /** @description Genuine static value declarations created by this factory. */
    readonly #values = new WeakSet<object>();

    /**
     * @description Constructs one declaration factory over package identity services.
     * @param identities - Registry validating primitive and property capabilities.
     * @param slots - Registry validating slot identities.
     * @param projections - Factory validating component projection declarations.
     */
    constructor(
        identities: TemplateIdentityRegistry,
        slots: TemplateSlotRegistry,
        projections: TemplateProjectionFactory,
    ) {
        this.#identities = identities;
        this.#slots = slots;
        this.#projections = projections;
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
     * @description Creates one frozen nested component declaration with static or dynamic inputs.
     * @typeParam ParentState - Read-only state of the declaring parent template.
     * @typeParam ChildInputs - Complete child component input value shape.
     * @typeParam ChildController - Public child controller object.
     * @param component - Genuine component-template composition identity.
     * @param options - Complete static snapshot or lazy evaluator declaration.
     * @returns An immutable genuine unnormalized nested component declaration.
     */
    createComponent<
        ParentState extends object,
        ChildInputs extends object,
        ChildController extends object,
    >(
        component: TemplatedComponentDefinition<ChildInputs, ChildController>,
        options: TemplateComponentOptionsType<ParentState, ChildInputs>,
    ): TemplateComponent<ParentState, undefined> {
        this.#assertRecord(options, "component options");
        const inputCandidate = Reflect.get(options, "inputs");
        const inputs = this.#createComponentInputs<ParentState, ChildInputs>(inputCandidate);
        const projections = this.#projections.copy<ParentState, ChildInputs, ChildController>(
            component,
            Reflect.get(options, "projections"),
        );
        const declaration = Object.freeze({
            kind: "component" as const,
            reference: undefined,
            component,
            inputs,
            projections,
        }) as TemplateComponent<ParentState, undefined>;
        this.#components.add(declaration);
        return declaration;
    }

    /**
     * @description Creates one frozen slot outlet with an optional child-owned fallback fragment.
     * @typeParam State - Read-only state of the receiving child template.
     * @typeParam Inputs - Complete value shape supplied to projected content.
     * @param slot - Genuine slot identity placed by this outlet.
     * @param options - Slot-input evaluator and optional fallback declarations.
     * @returns An immutable genuine unnormalized slot outlet declaration.
     */
    createOutlet<State extends object, Inputs extends object>(
        slot: TemplateSlot<Inputs>,
        options: TemplateOutletOptionsType<State, Inputs>,
    ): TemplateOutlet<State, Inputs, undefined> {
        this.#slots.assertSlot(slot);
        this.#assertRecord(options, "outlet options");
        const inputs = Reflect.get(options, "inputs");

        if (typeof inputs !== "function") {
            throw new TypeError("A template outlet input evaluator must be a function.");
        }

        const fallbackCandidates = this.#readArray(options, "fallback", "outlet fallback");

        for (const instruction of fallbackCandidates) {
            this.assertInstruction(instruction);
        }

        const fallback = Object.freeze([...fallbackCandidates]) as readonly TemplateInstructionType<
            State,
            undefined
        >[];
        const declaration = Object.freeze({
            kind: "outlet" as const,
            reference: undefined,
            slot,
            inputs,
            fallback,
        }) as TemplateOutlet<State, Inputs, undefined>;
        this.#outlets.add(declaration);
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
        const propertyCandidates = this.#readArray(options, "properties", "node properties");
        const childCandidates = this.#readArray(options, "children", "node children");

        for (const instruction of propertyCandidates) {
            this.#assertPropertyInstruction(instruction, primitive);
        }

        for (const child of childCandidates) {
            this.assertInstruction(child);
        }

        const properties = Object.freeze([
            ...propertyCandidates,
        ]) as readonly TemplatePropertyInstructionType<State, Primitive, undefined>[];
        const children = Object.freeze([...childCandidates]) as readonly TemplateInstructionType<
            State,
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
     * @description Verifies that a candidate is a genuine supported unnormalized instruction.
     * @param instruction - Candidate encountered in a root or child fragment.
     * @returns Nothing.
     */
    assertInstruction(
        instruction: unknown,
    ): asserts instruction is TemplateInstructionType<object, undefined> {
        if (
            !this.isNode(instruction) &&
            !this.isComponent(instruction) &&
            !this.isOutlet(instruction)
        ) {
            throw new TypeError(
                "A template fragment can contain only genuine Template declarations.",
            );
        }
    }

    /**
     * @description Reports whether a candidate is a genuine primitive node declaration.
     * @param value - Candidate instruction encountered during normalization.
     * @returns Whether the candidate was created by this declaration factory.
     */
    isNode(value: unknown): value is TemplateNode<object, TemplatePrimitive<object>, undefined> {
        return typeof value === "object" && value !== null && this.#nodes.has(value);
    }

    /**
     * @description Reports whether a candidate is a genuine nested component declaration.
     * @param value - Candidate instruction encountered during normalization.
     * @returns Whether the candidate was created by this declaration factory.
     */
    isComponent(value: unknown): value is TemplateComponent<object, undefined> {
        return typeof value === "object" && value !== null && this.#components.has(value);
    }

    /**
     * @description Reports whether a candidate is a genuine slot outlet declaration.
     * @param value - Candidate instruction encountered during normalization.
     * @returns Whether the candidate was created by this declaration factory.
     */
    isOutlet(value: unknown): value is TemplateOutlet<object, object, undefined> {
        return typeof value === "object" && value !== null && this.#outlets.has(value);
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
     * @description Creates an explicit static or dynamic component input declaration.
     * @typeParam ParentState - Read-only state of the declaring parent template.
     * @typeParam ChildInputs - Complete child component input value shape.
     * @param candidate - Static snapshot object or lazy evaluator from component options.
     * @returns A frozen discriminated component input declaration.
     */
    #createComponentInputs<ParentState extends object, ChildInputs extends object>(
        candidate:
            | ComponentInputValuesType<ChildInputs>
            | TemplateComponentInputEvaluatorType<ParentState, ChildInputs>,
    ): TemplateComponentInputType<ParentState, ChildInputs> {
        if (typeof candidate === "function") {
            return Object.freeze({
                kind: "binding" as const,
                evaluate: candidate,
            }) as TemplateComponentInputBinding<ParentState, ChildInputs>;
        }

        this.#assertRecord(candidate, "component input snapshot");
        return Object.freeze({
            kind: "value" as const,
            value: Object.freeze({ ...candidate }),
        }) as TemplateComponentInputValue<ChildInputs>;
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
     * @param description - Declaration family used in deterministic validation errors.
     * @returns A shallow copy of the supplied array or a new empty array.
     */
    #readArray(options: object | undefined, key: string, description: string): unknown[] {
        if (options === undefined) {
            return [];
        }

        const candidate = Reflect.get(options, key);

        if (candidate === undefined) {
            return [];
        }

        if (!Array.isArray(candidate)) {
            throw new TypeError(`Template ${description} must be an array.`);
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

    /**
     * @description Verifies one required caller value is a non-array record.
     * @param value - Candidate supplied to a declaration operation.
     * @param description - Record family used in deterministic validation errors.
     * @returns Nothing.
     */
    #assertRecord(value: unknown, description: string): asserts value is object {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            throw new TypeError(`Template ${description} must be a non-array object.`);
        }
    }
}
