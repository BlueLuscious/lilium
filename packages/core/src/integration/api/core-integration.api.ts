import type { ReactiveRuntime } from "../../reactivity/contracts/reactive-runtime.contract.js";
import type { CoreIntegrationApi } from "../contracts/core-integration-api.contract.js";
import type { RenderBindingRuntime as RenderBindingRuntimeContract } from "../contracts/render-binding-runtime.contract.js";
import { RenderBindingRuntime } from "../runtime/render-binding-runtime.js";

/**
 * @description Immutable adapter-facing API for creating Core render-binding capabilities.
 * @remarks This value is exported only through `@lilium/core/integration`.
 */
export const CoreIntegration: CoreIntegrationApi = Object.freeze({
    /**
     * @description Verifies that a candidate is one genuine live Core runtime.
     * @param runtime - Public runtime candidate supplied by an adapter consumer.
     * @returns Nothing when the candidate is a genuine live Core runtime.
     */
    assertRuntime(runtime: ReactiveRuntime): void {
        RenderBindingRuntime.assertRuntime(runtime);
    },

    /**
     * @description Creates a render-binding runtime connected to one genuine Core runtime.
     * @param runtime - Existing Core runtime that retains ownership of all services.
     * @returns A frozen narrow render-binding runtime.
     */
    createRuntime(runtime: ReactiveRuntime): RenderBindingRuntimeContract {
        return RenderBindingRuntime.create(runtime);
    },
});
