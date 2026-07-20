import type { ComponentInputValuesType, ComponentInstance } from "@lilium/component";
import type { RenderedApplication } from "./rendered-application.contract.js";

/**
 * @description Public lifecycle and update handle for one mounted templated component root.
 * @typeParam Inputs - Declarative component input value shape.
 * @typeParam Controller - Public controller object returned by component setup.
 */
export interface RenderedComponent<Inputs extends object, Controller extends object>
    extends RenderedApplication {
    /** @description Stable read-only headless component instance owned by this rendered root. */
    readonly component: ComponentInstance<Inputs, Controller>;

    /**
     * @description Replaces every root component input from one complete snapshot.
     * @remarks The update delegates through Component integration and is rejected after disposal.
     * @param inputs - Complete next component input values.
     * @returns Nothing.
     */
    update(inputs: ComponentInputValuesType<Inputs>): void;
}
