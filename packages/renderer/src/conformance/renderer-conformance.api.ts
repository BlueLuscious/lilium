import type { RendererConformanceAdapter } from "./contracts/renderer-conformance-adapter.contract.js";
import type { RendererConformanceApi } from "./contracts/renderer-conformance-api.contract.js";
import type { RendererConformanceScenario } from "./contracts/renderer-conformance-scenario.contract.js";
import { RendererConformanceScenarioFactory } from "./runtime/renderer-conformance.scenario-factory.js";

/** @description Frozen developer facade for universal Renderer host conformance scenarios. */
export const RendererConformance: RendererConformanceApi = Object.freeze({
    /**
     * @description Creates the canonical scenario set for one concrete host adapter.
     * @param adapter - Host factory and normalized observation bridge.
     * @returns Frozen scenarios with no host-specific branches.
     */
    scenarios(adapter: RendererConformanceAdapter): readonly RendererConformanceScenario[] {
        return new RendererConformanceScenarioFactory(adapter).create();
    },
});
