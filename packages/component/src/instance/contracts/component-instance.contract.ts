import type { ComponentControllerType } from "../../controller/types/component-controller.type.js";
import type { ComponentInputsType } from "../../inputs/types/component-inputs.type.js";

/**
 * @description Public handle for one initialized headless component occurrence.
 * @remarks An instance is exposed only after setup completes successfully. It owns its
 * setup resources through an internal scope and can be disposed without a renderer.
 * @typeParam Inputs - Declarative input value shape of the component.
 * @typeParam Controller - Public object shape returned by component setup.
 */
export interface ComponentInstance<Inputs extends object, Controller extends object> {
    /** @description Read-only public controller created during component setup. */
    readonly controller: ComponentControllerType<Controller>;

    /** @description Whether this component instance has begun or completed disposal. */
    readonly disposed: boolean;

    /** @description Stable read-only reactive inputs owned by this component instance. */
    readonly inputs: ComponentInputsType<Inputs>;

    /**
     * @description Disposes the component scope and every resource it owns.
     * @remarks Disposal is idempotent. The instance cannot receive input updates after
     * disposal, and its controller must no longer be used to create owned resources.
     * @returns Nothing.
     */
    dispose(): void;
}
