import type { ReactiveRuntime } from "@lilium/core";
import type { ComponentOccurrenceRuntime } from "./component-occurrence-runtime.contract.js";

/**
 * @description Adapter-facing object API that binds Component occurrences to one Core runtime.
 * @remarks The concrete `ComponentIntegration` value is exported only from
 * `@lilium/component/integration` and remains separate from the root `Component` API.
 */
export interface ComponentIntegrationApi {
    /**
     * @description Creates an occurrence runtime connected to one genuine Core runtime.
     * @remarks The returned object does not own or dispose the supplied reactive runtime.
     * @param runtime - Existing Core runtime used by every created component occurrence.
     * @returns A narrow runtime that creates renderer-owned component occurrences.
     */
    createRuntime(runtime: ReactiveRuntime): ComponentOccurrenceRuntime;
}
