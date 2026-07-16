import type { TemplateComponent } from "../../component/contracts/template-component.contract.js";
import type { TemplateNode } from "../../primitive/contracts/template-node.contract.js";
import type { TemplatePrimitive } from "../../primitive/contracts/template-primitive.contract.js";
import type { TemplateOutlet } from "../../slot/contracts/template-outlet.contract.js";
import type { TemplateReferenceType } from "./template-reference.type.js";

/**
 * @description Primitive node, nested component, or slot outlet in one template fragment.
 * @typeParam State - Read-only template occurrence state.
 * @typeParam Reference - Normalized reference type or `undefined` before definition creation.
 */
export type TemplateInstructionType<
    State extends object,
    Reference extends TemplateReferenceType | undefined = TemplateReferenceType,
> =
    | TemplateNode<State, TemplatePrimitive<object>, Reference>
    | TemplateComponent<State, Reference>
    | TemplateOutlet<State, object, Reference>;
