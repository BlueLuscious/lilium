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
     * @description Creates a render-binding runtime connected to one genuine Core runtime.
     * @param runtime - Existing Core runtime that retains ownership of all services.
     * @returns A frozen narrow render-binding runtime.
     */
    createRuntime(runtime: ReactiveRuntime): RenderBindingRuntimeContract {
        return RenderBindingRuntime.create(runtime);
    },
});
