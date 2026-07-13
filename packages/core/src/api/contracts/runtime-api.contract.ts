import type { ReactiveRuntime } from "../../reactivity/contracts/reactive-runtime.contract.js";

/**
 * @description Stateless public object API for creating isolated reactive runtimes.
 * @remarks The public `Runtime` value implements this contract. Concrete runtime classes
 * remain internal so construction cannot bypass runtime invariants.
 */
export interface RuntimeApi {
    /**
     * @description Creates one isolated reactive runtime and root ownership boundary.
     * @returns A new reactive runtime with no reactive resources or child scopes.
     */
    create(): ReactiveRuntime;
}
