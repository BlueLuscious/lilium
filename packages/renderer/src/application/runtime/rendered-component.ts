import type { ComponentInputValuesType, ComponentInstance } from "@lilium/component";
import type { RendererComponentOccurrence } from "../../execution/runtime/renderer-component.occurrence.js";
import { RendererCleanupCollector } from "../../shared/runtime/renderer-cleanup.collector.js";
import type { RenderedComponent as RenderedComponentContract } from "../contracts/rendered-component.contract.js";
import { RenderedComponentInstance } from "./rendered-component.instance.js";
import type { RendererApplicationLifecycle } from "./renderer-application.lifecycle.js";

/**
 * @description Frozen public lifecycle and update handle for one mounted root Component.
 * @typeParam Inputs - Complete root Component input value shape.
 * @typeParam Controller - Public controller returned by Component setup.
 */
export class RenderedComponent<Inputs extends object, Controller extends object>
    implements RenderedComponentContract<Inputs, Controller>
{
    /** @description Shared application lifecycle controlling terminal cleanup. */
    readonly #lifecycle: RendererApplicationLifecycle<object, object>;
    /** @description Private rendered occurrence retaining protected input update authority. */
    readonly #occurrence: RendererComponentOccurrence<object, object, Inputs, Controller>;
    /** @description Root-aware public Component instance view. */
    readonly component: ComponentInstance<Inputs, Controller>;

    /**
     * @description Creates one immutable root Component mount handle.
     * @param lifecycle - Complete rendered application lifecycle.
     * @param occurrence - Protected headless and visual Component composition.
     */
    constructor(
        lifecycle: RendererApplicationLifecycle<object, object>,
        occurrence: RendererComponentOccurrence<object, object, Inputs, Controller>,
    ) {
        this.#lifecycle = lifecycle;
        this.#occurrence = occurrence;
        this.component = new RenderedComponentInstance(occurrence.component.instance, lifecycle);
        Object.freeze(this);
    }

    /**
     * @description Reports whether this mounted Component application is terminal.
     * @returns Shared application disposal state.
     */
    get disposed(): boolean {
        return this.#lifecycle.disposed;
    }

    /**
     * @description Idempotently releases the complete mounted Component application.
     * @returns Nothing after terminal cleanup completes.
     */
    dispose(): void {
        this.#lifecycle.dispose();
    }

    /**
     * @description Replaces complete root inputs and terminalizes after any update failure.
     * @param inputs - Complete next root Component input snapshot.
     * @returns Nothing after the synchronous Component update and reactive flush complete.
     */
    update(inputs: ComponentInputValuesType<Inputs>): void {
        this.#lifecycle.assertOpen("update root Component inputs");

        try {
            this.#occurrence.component.updateInputs(inputs);
        } catch (error) {
            const cleanup = new RendererCleanupCollector();
            cleanup.add(error);
            cleanup.attempt(() => this.#lifecycle.dispose());
            cleanup.throwIfAny("Root Component update and Renderer cleanup failed.");
        }
    }
}
