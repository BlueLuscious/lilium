import type { RendererConformanceAssertions } from "./renderer-conformance-assertions.contract.js";

/** @description One reusable host-neutral Renderer behavior scenario. */
export interface RendererConformanceScenario {
    /** @description Stable human-readable scenario name registered by a test runner. */
    readonly name: string;

    /**
     * @description Executes the complete scenario against its configured host adapter.
     * @param assertions - Test-runner-neutral assertion implementation.
     * @returns Nothing when every universal behavior assertion passes.
     */
    run(assertions: RendererConformanceAssertions): void;
}
