import type { RenderBinding as RenderBindingContract } from "../contracts/render-binding.contract.js";
import type { RenderBindingLifecycle } from "./render-binding-lifecycle.js";

/**
 * @description Protected public render-binding object that erases scheduler and tracker roles.
 * @remarks The frozen wrapper delegates only disposal. Internal lifecycle methods and state do
 * not exist on this JavaScript object and cannot escape through the integration subpath.
 */
export class RenderBinding implements RenderBindingContract {
    /** @description Internal lifecycle retaining scheduler and dependency consumer authority. */
    readonly #lifecycle: RenderBindingLifecycle;

    /**
     * @description Creates a protected public view over one initialized binding lifecycle.
     * @param lifecycle - Internal lifecycle whose scheduler and tracker roles remain private.
     * @returns A frozen binding exposing only idempotent disposal.
     */
    static create(lifecycle: RenderBindingLifecycle): RenderBindingContract {
        return new RenderBinding(lifecycle);
    }

    /**
     * @description Constructs and freezes one protected binding wrapper.
     * @param lifecycle - Internal lifecycle receiving delegated disposal.
     */
    private constructor(lifecycle: RenderBindingLifecycle) {
        this.#lifecycle = lifecycle;
        Object.freeze(this);
    }

    /**
     * @description Permanently disposes the hidden render-binding lifecycle.
     * @returns Nothing.
     */
    dispose(): void {
        this.#lifecycle.dispose();
    }
}
