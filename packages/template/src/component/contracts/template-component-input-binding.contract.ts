import type { TemplateComponentInputEvaluatorType } from "../types/template-component-input-evaluator.type.js";

/**
 * @description Immutable lazy complete-input binding for one nested component declaration.
 * @remarks Template stores but never evaluates this function. Renderer later tracks it as one
 * binding and forwards each complete accepted snapshot through Component integration.
 * @typeParam ParentState - Read-only state of the declaring parent template.
 * @typeParam ChildInputs - Declarative input value shape of the nested component.
 */
export interface TemplateComponentInputBinding<
    ParentState extends object,
    ChildInputs extends object,
> {
    /** @description Discriminant identifying a dynamic component input declaration. */
    readonly kind: "binding";

    /** @description Pure synchronous complete-input evaluator retained by reference. */
    readonly evaluate: TemplateComponentInputEvaluatorType<ParentState, ChildInputs>;
}
