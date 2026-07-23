import type { TemplatePrimitive, TemplateProperty } from "@lilium/template";
import type { RendererConformanceFailureType } from "./renderer-conformance-failure.type.js";
import type { RendererConformancePrimitiveSupportType } from "./renderer-conformance-primitive-support.type.js";

/** @description Portable capability and failure configuration for one conformance host. */
export type RendererConformanceHostOptionsType = Readonly<{
    /** @description Complete primitive capability support requested by the scenario. */
    primitives: readonly RendererConformancePrimitiveSupportType[];

    /** @description Configured primitives deliberately resolved as unsupported. */
    omittedPrimitives?: readonly TemplatePrimitive<object>[];

    /** @description Configured properties deliberately resolved as unsupported. */
    omittedProperties?: readonly TemplateProperty[];

    /** @description Deterministic operation failures reset for each host opening attempt. */
    failures?: readonly RendererConformanceFailureType[];
}>;
