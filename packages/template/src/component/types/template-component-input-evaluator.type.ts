import type { ComponentInputValuesType } from "@lilium/component";

/**
 * @description Pure synchronous evaluator producing complete nested-component inputs.
 * @typeParam ParentState - Read-only state of the declaring parent template.
 * @typeParam ChildInputs - Declarative input value shape of the nested component.
 * @param state - Current read-only parent template state.
 * @returns A complete nested-component input snapshot.
 */
export type TemplateComponentInputEvaluatorType<
    ParentState extends object,
    ChildInputs extends object,
> = {
    /**
     * @description Evaluates one complete child-component input snapshot.
     * @param state - Current read-only parent template state.
     * @returns A complete nested-component input snapshot.
     */
    bivarianceHack(state: Readonly<ParentState>): ComponentInputValuesType<ChildInputs>;
}["bivarianceHack"];
