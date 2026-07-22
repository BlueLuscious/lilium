import type { TemplatePrimitive, TemplateProperty } from "@lilium/template";

/** @description Deduplicated capability requirements for one exact Template primitive identity. */
export type TRendererPrimitiveRequirement = Readonly<{
    /** @description Exact portable primitive identity required by reachable declarations. */
    primitive: TemplatePrimitive<object>;

    /** @description Ordered unique property identities required by this primitive. */
    properties: readonly TemplateProperty[];

    /** @description Whether at least one reachable occurrence places host children beneath it. */
    requiresChildren: boolean;
}>;
