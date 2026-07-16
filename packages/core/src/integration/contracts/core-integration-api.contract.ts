import type { ReactiveRuntime } from "../../reactivity/contracts/reactive-runtime.contract.js";
import type { RenderBindingRuntime } from "./render-binding-runtime.contract.js";

/**
 * @description Adapter-facing object API that binds rendering coordination to one Core runtime.
 * @remarks The concrete `CoreIntegration` value is exported only from `@lilium/core/integration`.
 * The package root does not expose this authority to ordinary application consumers.
 */
export interface CoreIntegrationApi {
    /**
     * @description Verifies that a candidate is one genuine live Core runtime.
     * @remarks This assertion grants no access to the private runtime context and exists so
     * adapter packages can reject structural foreign implementations before retaining them.
     * @param runtime - Public runtime candidate supplied by an adapter consumer.
     * @returns Nothing when the candidate is a genuine live Core runtime.
     */
    assertRuntime(runtime: ReactiveRuntime): void;

    /**
     * @description Creates a render-binding runtime connected to one genuine Core runtime.
     * @remarks Foreign structural implementations are rejected by the concrete integration API.
     * The returned object does not own or dispose the supplied reactive runtime.
     * @param runtime - Existing Core runtime that owns tracking, scheduling, and ownership.
     * @returns A narrow runtime that creates owned render bindings.
     */
    createRuntime(runtime: ReactiveRuntime): RenderBindingRuntime;
}
