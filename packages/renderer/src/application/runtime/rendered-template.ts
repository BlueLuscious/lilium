import type { RenderedTemplate as RenderedTemplateContract } from "../contracts/rendered-template.contract.js";
import type { RendererApplicationLifecycle } from "./renderer-application.lifecycle.js";

/**
 * @description Frozen public lifecycle handle for one mounted standalone Template.
 * @typeParam State - Read-only state retained by the mounted Template occurrence.
 */
export class RenderedTemplate<State extends object> implements RenderedTemplateContract<State> {
    /** @description Shared application lifecycle controlling terminal cleanup. */
    readonly #lifecycle: RendererApplicationLifecycle<object, object>;
    /** @description Exact state object supplied by the caller during mounting. */
    readonly state: Readonly<State>;

    /**
     * @description Creates one immutable standalone Template mount handle.
     * @param lifecycle - Complete rendered application lifecycle.
     * @param state - Exact state object retained without mutation or cloning.
     */
    constructor(lifecycle: RendererApplicationLifecycle<object, object>, state: State) {
        this.#lifecycle = lifecycle;
        this.state = state;
        Object.freeze(this);
    }

    /**
     * @description Reports whether this mounted Template is terminal.
     * @returns Shared application disposal state.
     */
    get disposed(): boolean {
        return this.#lifecycle.disposed;
    }

    /**
     * @description Idempotently releases the complete mounted Template application.
     * @returns Nothing after terminal cleanup completes.
     */
    dispose(): void {
        this.#lifecycle.dispose();
    }
}
