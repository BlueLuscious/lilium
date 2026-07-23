import type { RendererConformanceHostOptionsType } from "../types/renderer-conformance-host-options.type.js";
import type { RendererConformanceHost } from "./renderer-conformance-host.contract.js";

/** @description Host-specific factory consumed by universal Renderer conformance scenarios. */
export interface RendererConformanceAdapter {
    /**
     * @description Creates one independently observable host from portable capability options.
     * @param options - Primitive support, omissions, and deterministic failure configuration.
     * @returns Host protocol implementation plus normalized conformance observations.
     */
    createHost(options: RendererConformanceHostOptionsType): RendererConformanceHost;
}
