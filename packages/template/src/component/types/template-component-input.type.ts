import type { TemplateComponentInputBinding } from "../contracts/template-component-input-binding.contract.js";
import type { TemplateComponentInputValue } from "../contracts/template-component-input-value.contract.js";

/**
 * @description Static snapshot or lazy evaluator used by one nested component instruction.
 * @typeParam ParentState - Read-only state of the declaring parent template.
 * @typeParam ChildInputs - Declarative input value shape of the nested component.
 */
export type TemplateComponentInputType<ParentState extends object, ChildInputs extends object> =
    | TemplateComponentInputValue<ChildInputs>
    | TemplateComponentInputBinding<ParentState, ChildInputs>;
