import type { TemplatePrimitive, TemplateProperty } from "@lilium/template";

/** @description Portable primitive capability declaration used by conformance adapters. */
export type RendererConformancePrimitiveSupportType = Readonly<{
    /** @description Exact Template primitive identity requested by Renderer. */
    primitive: TemplatePrimitive<object>;

    /** @description Whether values of this primitive may receive children. */
    acceptsChildren?: boolean;

    /** @description Exact ordered property identities implemented for the primitive. */
    properties?: readonly TemplateProperty[];
}>;
