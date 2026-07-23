import type { ReactiveRuntime } from "@lilium/core";
import type { RendererHost } from "../../host/contracts/renderer-host.contract.js";
import type { RendererRuntime } from "../../runtime/contracts/renderer-runtime.contract.js";

/**
 * @description Stateless object API for creating target-independent Renderer runtimes.
 * @remarks The concrete frozen `Renderer` value implements this contract. Runtime creation
 * retains but does not own the supplied Core runtime or host.
 */
export interface RendererApi {
    /**
     * @description Creates one Renderer runtime bound to a Core runtime and reusable host adapter.
     * @typeParam Root - External host root accepted by the adapter.
     * @typeParam Parent - Opaque host handle that may receive placed values.
     * @typeParam Value - Opaque host value handle created by primitive capabilities.
     * @param runtime - Existing Core runtime that owns scheduling and application scopes.
     * @param host - Reusable target adapter that opens exclusive root sessions.
     * @returns A reusable Renderer runtime that owns neither dependency.
     */
    createRuntime<Root, Parent extends object, Value extends Parent>(
        runtime: ReactiveRuntime,
        host: RendererHost<Root, Parent, Value>,
    ): RendererRuntime<Root>;
}
