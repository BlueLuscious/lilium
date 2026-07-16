import type { ReactiveRuntime } from "@lilium/core";
import type { ComponentIntegrationApi } from "../contracts/component-integration-api.contract.js";
import type { ComponentOccurrenceRuntime as ComponentOccurrenceRuntimeContract } from "../contracts/component-occurrence-runtime.contract.js";
import { ComponentOccurrenceRuntime } from "../runtime/component-occurrence-runtime.js";

/**
 * @description Immutable adapter-facing API for creating Component occurrence capabilities.
 * @remarks This value is exported only through `@lilium/component/integration`.
 */
export const ComponentIntegration: ComponentIntegrationApi = Object.freeze({
    /**
     * @description Creates an occurrence runtime connected to one genuine live Core runtime.
     * @param runtime - Existing Core runtime retained without ownership transfer.
     * @returns A frozen narrow component occurrence runtime.
     */
    createRuntime(runtime: ReactiveRuntime): ComponentOccurrenceRuntimeContract {
        return ComponentOccurrenceRuntime.create(runtime);
    },
});
