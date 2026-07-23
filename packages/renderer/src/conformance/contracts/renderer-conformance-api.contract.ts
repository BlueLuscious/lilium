import type { RendererConformanceAdapter } from "./renderer-conformance-adapter.contract.js";
import type { RendererConformanceScenario } from "./renderer-conformance-scenario.contract.js";

/** @description Supported developer boundary for reusable universal Renderer conformance. */
export interface RendererConformanceApi {
    /**
     * @description Creates the canonical scenario set for one concrete host adapter.
     * @param adapter - Host factory and normalized observation bridge.
     * @returns Frozen scenarios with no host-specific branches.
     */
    scenarios(adapter: RendererConformanceAdapter): readonly RendererConformanceScenario[];
}
