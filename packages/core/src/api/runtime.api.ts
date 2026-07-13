import { ReactiveRuntimeRuntime } from "../reactivity/runtime/reactive-runtime/reactive-runtime.runtime.js";
import type { RuntimeApi } from "./contracts/runtime-api.contract.js";

/**
 * @description Immutable public factory for isolated reactive runtimes.
 * @remarks Concrete implementation classes remain behind the package boundary.
 */
export const Runtime: RuntimeApi = Object.freeze({
    /**
     * @description Creates one isolated reactive runtime and ownership root.
     * @returns A new frozen reactive runtime object.
     */
    create: () => ReactiveRuntimeRuntime.create(),
});
