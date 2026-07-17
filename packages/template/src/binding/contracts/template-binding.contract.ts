import type { TemplateReferenceType } from "../../definition/types/template-reference.type.js";
import type { TemplatePrimitive } from "../../primitive/contracts/template-primitive.contract.js";
import type { TemplateProperty } from "../../primitive/contracts/template-property.contract.js";
import type { TemplateBindingEqualityType } from "../types/template-binding-equality.type.js";
import type { TemplateBindingEvaluatorType } from "../types/template-binding-evaluator.type.js";

/**
 * @description Immutable declaration for one independently tracked dynamic primitive property.
 * @remarks References remain `undefined` before definition normalization. Renderer creates one
 * Core render binding per normalized declaration and owns all execution state externally.
 * @typeParam State - Read-only occurrence state evaluated by this binding.
 * @typeParam Primitive - Primitive identity that owns the target property.
 * @typeParam Value - Evaluated property value type.
 * @typeParam Reference - Normalized reference type or `undefined` before definition creation.
 */
export interface TemplateBinding<
    State extends object,
    Primitive extends TemplatePrimitive<object> = TemplatePrimitive<object>,
    Value = unknown,
    Reference extends TemplateReferenceType | undefined = TemplateReferenceType | undefined,
> {
    /** @description Discriminant identifying a dynamic property binding declaration. */
    readonly kind: "binding";

    /** @description Definition-local identity of this binding after normalization. */
    readonly reference: Reference;

    /** @description Definition-local primitive node targeted after normalization. */
    readonly target: Reference;

    /** @description Property capability evaluated and applied by this binding. */
    readonly property: TemplateProperty<Primitive, Value>;

    /** @description Pure synchronous evaluator retained by reference. */
    readonly evaluate: TemplateBindingEvaluatorType<State, Value>;

    /** @description Equality operation used before applying later candidate values. */
    readonly equal: TemplateBindingEqualityType<Value>;
}
