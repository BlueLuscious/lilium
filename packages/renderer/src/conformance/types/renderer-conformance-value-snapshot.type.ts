import type { TemplatePrimitive } from "@lilium/template";
import type { RendererConformancePropertySnapshotType } from "./renderer-conformance-property-snapshot.type.js";

/** @description Normalized recursive logical value observed by a conformance host. */
export type RendererConformanceValueSnapshotType = Readonly<{
    /** @description Exact Template primitive identity used to create the value. */
    primitive: TemplatePrimitive<object>;

    /** @description Latest property values in first-write order. */
    properties: readonly RendererConformancePropertySnapshotType[];

    /** @description Ordered recursive logical children. */
    children: readonly RendererConformanceValueSnapshotType[];
}>;
