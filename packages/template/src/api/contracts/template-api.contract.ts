import type { ComponentDefinition } from "@lilium/component";
import type { TemplateBinding } from "../../binding/contracts/template-binding.contract.js";
import type { TemplateBindingEvaluatorType } from "../../binding/types/template-binding-evaluator.type.js";
import type { TemplateBindingOptionsType } from "../../binding/types/template-binding-options.type.js";
import type { TemplateComponent } from "../../component/contracts/template-component.contract.js";
import type { TemplatedComponentDefinition } from "../../component/contracts/templated-component-definition.contract.js";
import type { ComponentTemplateStateType } from "../../component/types/component-template-state.type.js";
import type { TemplateComponentOptionsType } from "../../component/types/template-component-options.type.js";
import type { TemplateDefinition } from "../../definition/contracts/template-definition.contract.js";
import type { TemplateDefinitionOptionsType } from "../../definition/types/template-definition-options.type.js";
import type { TemplateNode } from "../../primitive/contracts/template-node.contract.js";
import type { TemplatePrimitive } from "../../primitive/contracts/template-primitive.contract.js";
import type { TemplateProperty } from "../../primitive/contracts/template-property.contract.js";
import type { TemplateStaticValue } from "../../primitive/contracts/template-static-value.contract.js";
import type { TemplateNodeOptionsType } from "../../primitive/types/template-node-options.type.js";
import type { TemplateOutlet } from "../../slot/contracts/template-outlet.contract.js";
import type { TemplateProjection } from "../../slot/contracts/template-projection.contract.js";
import type { TemplateSlot } from "../../slot/contracts/template-slot.contract.js";
import type { TemplateOutletOptionsType } from "../../slot/types/template-outlet-options.type.js";
import type { TemplateProjectionStateType } from "../../slot/types/template-projection-state.type.js";

/**
 * @description Stateless object API for declaring target-independent immutable template programs.
 * @remarks The frozen `Template` value implements this contract incrementally as each feature
 * gains real behavior. Every operation is synchronous and captures no runtime, renderer, host,
 * owner, or mounted occurrence.
 */
export interface TemplateApi {
    /**
     * @description Creates a portable primitive capability identity.
     * @typeParam Properties - Declarative property schema associated with the primitive.
     * @param name - Optional immutable diagnostic name.
     * @returns A new primitive identity containing no host implementation.
     */
    primitive<Properties extends object = object>(name?: string): TemplatePrimitive<Properties>;

    /**
     * @description Creates one typed property identity owned by a primitive identity.
     * @typeParam Value - Value accepted by the property.
     * @typeParam Primitive - Primitive identity that exclusively owns the property.
     * @param primitive - Primitive capability that owns this property.
     * @param name - Optional immutable diagnostic name.
     * @returns A new typed property capability identity.
     */
    property<Value, Primitive extends TemplatePrimitive<object> = TemplatePrimitive<object>>(
        primitive: Primitive,
        name?: string,
    ): TemplateProperty<Primitive, Value>;

    /**
     * @description Creates one stable named projection-point identity.
     * @typeParam Inputs - Complete slot input value shape.
     * @param name - Optional diagnostic name; omission selects the canonical default name.
     * @returns A new typed slot identity.
     */
    slot<Inputs extends object = object>(name?: string): TemplateSlot<Inputs>;

    /**
     * @description Declares one property value applied once during instantiation.
     * @typeParam Primitive - Primitive identity that owns the property.
     * @typeParam Value - Static value accepted by the property.
     * @param property - Typed primitive property capability.
     * @param value - Application value retained by reference.
     * @returns An immutable unnormalized static value declaration.
     */
    value<Primitive extends TemplatePrimitive<object>, Value>(
        property: TemplateProperty<Primitive, Value>,
        value: Value,
    ): TemplateStaticValue<Primitive, Value>;

    /**
     * @description Declares one independently tracked dynamic primitive property.
     * @typeParam Primitive - Primitive identity that owns the property.
     * @typeParam Value - Evaluated property value type.
     * @typeParam State - Read-only template occurrence state.
     * @param property - Typed primitive property capability.
     * @param evaluate - Pure synchronous evaluator retained by reference.
     * @param options - Optional binding equality behavior.
     * @returns An immutable unnormalized property binding.
     */
    binding<Primitive extends TemplatePrimitive<object>, Value, State extends object = object>(
        property: TemplateProperty<Primitive, Value>,
        evaluate: TemplateBindingEvaluatorType<State, Value>,
        options?: TemplateBindingOptionsType<Value>,
    ): TemplateBinding<State, Primitive, Value, undefined>;

    /**
     * @description Declares one primitive node and its ordered properties and children.
     * @typeParam State - Read-only template occurrence state.
     * @typeParam Primitive - Portable primitive capability represented by the node.
     * @param primitive - Primitive capability instantiated by compatible Renderer adapters.
     * @param options - Optional property and child declarations.
     * @returns An immutable unnormalized primitive node declaration.
     */
    node<
        State extends object = object,
        Primitive extends TemplatePrimitive<object> = TemplatePrimitive<object>,
    >(
        primitive: Primitive,
        options?: TemplateNodeOptionsType<State, Primitive>,
    ): TemplateNode<State, Primitive, undefined>;

    /**
     * @description Declares one nested templated component without creating an occurrence.
     * @typeParam ParentState - Read-only state of the declaring parent template.
     * @typeParam ChildInputs - Complete child component input value shape.
     * @typeParam ChildController - Public child controller object.
     * @param component - Existing immutable component-template composition.
     * @param options - Complete inputs and optional ordered projections.
     * @returns An immutable unnormalized nested-component declaration.
     */
    component<
        ParentState extends object,
        ChildInputs extends object,
        ChildController extends object,
    >(
        component: TemplatedComponentDefinition<ChildInputs, ChildController>,
        options: TemplateComponentOptionsType<ParentState, ChildInputs>,
    ): TemplateComponent<ParentState, undefined>;

    /**
     * @description Declares one slot outlet and optional child-owned fallback fragment.
     * @typeParam State - Read-only state of the receiving child template.
     * @typeParam Inputs - Complete slot input value shape.
     * @param slot - Stable slot identity placed by this outlet.
     * @param options - Complete slot-input evaluator and optional fallback declarations.
     * @returns An immutable unnormalized slot outlet declaration.
     */
    outlet<State extends object, Inputs extends object>(
        slot: TemplateSlot<Inputs>,
        options: TemplateOutletOptionsType<State, Inputs>,
    ): TemplateOutlet<State, Inputs, undefined>;

    /**
     * @description Declares parent-owned content projected into one typed child slot.
     * @typeParam ParentState - Read-only state of the supplying parent template.
     * @typeParam SlotInputs - Complete input shape supplied by the receiving slot.
     * @param slot - Genuine child slot identity receiving projected content.
     * @param template - Genuine template evaluated against parent and reactive slot state.
     * @returns A genuine immutable projection declaration.
     */
    projection<ParentState extends object, SlotInputs extends object>(
        slot: TemplateSlot<SlotInputs>,
        template: TemplateDefinition<TemplateProjectionStateType<ParentState, SlotInputs>>,
    ): TemplateProjection<ParentState, SlotInputs>;

    /**
     * @description Validates, copies, normalizes, and freezes one complete template program.
     * @typeParam State - Read-only object supplied to each Renderer occurrence.
     * @param definition - Caller-owned ordered root declarations.
     * @returns A reusable template identity with deterministic definition-local references.
     */
    define<State extends object>(
        definition: TemplateDefinitionOptionsType<State>,
    ): TemplateDefinition<State>;

    /**
     * @description Composes independent compatible headless behavior and visual definitions.
     * @typeParam Inputs - Declarative component input value shape.
     * @typeParam Controller - Public controller object returned by setup.
     * @param component - Reusable headless component definition.
     * @param template - Reusable template accepting the component state shape.
     * @returns A separate immutable component-template composition identity.
     */
    compose<Inputs extends object, Controller extends object>(
        component: ComponentDefinition<Inputs, Controller>,
        template: TemplateDefinition<ComponentTemplateStateType<Inputs, Controller>>,
    ): TemplatedComponentDefinition<Inputs, Controller>;
}
