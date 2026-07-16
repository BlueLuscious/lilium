import type { ComponentInputValuesType } from "@lilium/component";

/**
 * @description Immutable static complete-input snapshot for one nested component declaration.
 * @remarks The snapshot container is copied and frozen while each application value is retained
 * by reference. Renderer applies it once and creates no reactive input binding.
 * @typeParam Inputs - Declarative input value shape of the nested component.
 */
export interface TemplateComponentInputValue<Inputs extends object> {
    /** @description Discriminant identifying a static component input declaration. */
    readonly kind: "value";

    /** @description Complete immutable child-component input snapshot. */
    readonly value: ComponentInputValuesType<Inputs>;
}
