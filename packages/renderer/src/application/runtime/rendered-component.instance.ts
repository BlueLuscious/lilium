import type { ComponentInstance } from "@lilium/component";
import type { RendererApplicationLifecycle } from "./renderer-application.lifecycle.js";

/**
 * @description Root-aware public Component instance view for one rendered application.
 * @remarks Controller and inputs preserve the genuine Component identities, while disposal
 * delegates to the complete Renderer application instead of bypassing host and session cleanup.
 * @typeParam Inputs - Complete root Component input value shape.
 * @typeParam Controller - Public controller returned by Component setup.
 */
export class RenderedComponentInstance<Inputs extends object, Controller extends object>
    implements ComponentInstance<Inputs, Controller>
{
    /** @description Genuine initialized Component instance supplying public read-only data. */
    readonly #instance: ComponentInstance<Inputs, Controller>;
    /** @description Complete rendered application lifecycle receiving disposal authority. */
    readonly #lifecycle: RendererApplicationLifecycle<object, object>;

    /** @description Stable read-only controller from the genuine Component instance. */
    readonly controller: ComponentInstance<Inputs, Controller>["controller"];
    /** @description Stable read-only reactive inputs from the genuine Component instance. */
    readonly inputs: ComponentInstance<Inputs, Controller>["inputs"];

    /**
     * @description Creates one immutable root-aware view over a genuine Component instance.
     * @param instance - Genuine initialized root Component instance.
     * @param lifecycle - Complete Renderer application lifecycle.
     */
    constructor(
        instance: ComponentInstance<Inputs, Controller>,
        lifecycle: RendererApplicationLifecycle<object, object>,
    ) {
        this.#instance = instance;
        this.#lifecycle = lifecycle;
        this.controller = instance.controller;
        this.inputs = instance.inputs;
        Object.freeze(this);
    }

    /**
     * @description Reports terminal state from both Renderer and the underlying Component.
     * @returns Whether the root application or genuine Component has become disposed.
     */
    get disposed(): boolean {
        return this.#lifecycle.disposed || this.#instance.disposed;
    }

    /**
     * @description Disposes the complete rendered application rather than only its Component.
     * @returns Nothing after Renderer resources and the host session complete cleanup.
     */
    dispose(): void {
        this.#lifecycle.dispose();
    }
}
