import type { ReactiveRuntime } from "@lilium/core";
import type { RendererHost } from "../host/contracts/renderer-host.contract.js";
import type { RendererRuntime as RendererRuntimeContract } from "../runtime/contracts/renderer-runtime.contract.js";
import { RendererRuntime } from "../runtime/renderer-runtime.js";
import type { RendererApi } from "./contracts/renderer-api.contract.js";

/** @description Immutable stateless public facade for target-independent Renderer runtimes. */
export const Renderer: RendererApi = Object.freeze({
    /**
     * @description Creates one reusable Renderer runtime without owning its dependencies.
     * @typeParam Root - External host root type accepted by the adapter.
     * @typeParam Parent - Opaque host handle shape that may contain rendered values.
     * @typeParam Value - Opaque host value shape created by primitive capabilities.
     * @param runtime - Genuine live Core runtime used for ownership and scheduling.
     * @param host - Reusable synchronous target adapter opening exclusive sessions.
     * @returns A frozen Renderer runtime bound to the supplied dependencies.
     */
    createRuntime<Root, Parent extends object, Value extends Parent>(
        runtime: ReactiveRuntime,
        host: RendererHost<Root, Parent, Value>,
    ): RendererRuntimeContract<Root> {
        return RendererRuntime.create(runtime, host);
    },
});
