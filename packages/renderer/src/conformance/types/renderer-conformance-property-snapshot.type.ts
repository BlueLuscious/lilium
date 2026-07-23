import type { TemplateProperty } from "@lilium/template";

/** @description Normalized latest property value observed by a conformance host. */
export type RendererConformancePropertySnapshotType = Readonly<{
    /** @description Exact Template property identity written by Renderer. */
    property: TemplateProperty;

    /** @description Latest host candidate for the property. */
    value: unknown;
}>;
