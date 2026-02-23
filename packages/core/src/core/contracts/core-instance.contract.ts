import type { CoreInspection } from "./core-inspection.contract";
import type { ComponentDefinition } from "../../component/contracts/component-definition.contract";
import type { ComponentInstance } from "../../component/contracts/component-instance.contract";
import type { AbstractViewTree } from "../../render/contracts/abstract-view-tree.contract";
import type { Action } from "../../shared/contracts/action.contract";


/**
 * @description Public Core runtime interface.
 * @remarks The instance returned by `mount` is internally mutable; consumers
 * should treat it as a read-only handle.
 */
export interface CoreInstance {
    /**
     * @description Registers a component definition in the Core.
     * @param definition - Component definition to register.
     */
    defineComponent(definition: ComponentDefinition): void;

    /**
     * @description Mounts a component definition as the root component.
     * @param definition - Component definition to mount.
     * @param inputs - Optional inputs passed to the root component.
     * @returns The mounted root component instance.
     */
    mount(definition: ComponentDefinition, inputs?: unknown): ComponentInstance;

    /**
     * @description Unmounts the currently mounted root component.
     * @param root - Root component instance to unmount.
     */
    unmount(root: ComponentInstance): void;

    /**
     * @description Dispatches an action to the mounted component tree.
     * @param action - Action to dispatch.
     */
    dispatch(action: Action): void;

    /**
     * @description Flushes pending work and returns the latest rendered view tree.
     * @returns The last rendered abstract view tree, or null if nothing is mounted.
     */
    render(): AbstractViewTree | null;

    /**
     * @description Returns a diagnostic snapshot of the Core state.
     * @remarks This method is intended for debugging and development purposes
     * only and MUST NOT be considered a stable API.
     * @returns A minimal diagnostic snapshot.
     */
    inspect(): CoreInspection;
}
