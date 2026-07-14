import type { ComponentControllerType } from "../../controller/types/component-controller.type.js";
import type { ComponentInputsType } from "../../inputs/types/component-inputs.type.js";
import type { ComponentInstance as ComponentInstanceContract } from "../contracts/component-instance.contract.js";
import type { IComponentInstanceLifecycle } from "../contracts/internal/component-instance-lifecycle.contract.js";

/**
 * @description Public runtime object for one initialized component occurrence.
 * @remarks This object delegates lifecycle observation and disposal while erasing the
 * internal input update capability from both TypeScript and JavaScript consumers.
 * @typeParam Inputs - Declarative input value shape of the component.
 * @typeParam Controller - Public object shape returned by component setup.
 */
export class ComponentInstance<Inputs extends object, Controller extends object>
    implements ComponentInstanceContract<Inputs, Controller>
{
    /** @description Internal mutable lifecycle hidden behind the public instance boundary. */
    readonly #lifecycle: IComponentInstanceLifecycle<Inputs, Controller>;

    /** @description Read-only controller returned by successful component setup. */
    readonly controller: ComponentControllerType<Controller>;

    /** @description Stable read-only reactive inputs shared with component setup. */
    readonly inputs: ComponentInputsType<Inputs>;

    /**
     * @description Creates one frozen public view over an initialized internal lifecycle.
     * @param lifecycle - Internal lifecycle whose mutable capabilities must remain private.
     */
    private constructor(lifecycle: IComponentInstanceLifecycle<Inputs, Controller>) {
        this.#lifecycle = lifecycle;
        this.controller = lifecycle.controller;
        this.inputs = lifecycle.inputs;
        Object.freeze(this);
    }

    /**
     * @description Creates a public instance that exposes no internal update capability.
     * @typeParam Inputs - Declarative input value shape of the component.
     * @typeParam Controller - Public object shape returned by component setup.
     * @param lifecycle - Initialized internal lifecycle to protect behind the public object.
     * @returns A frozen public component instance.
     */
    static create<Inputs extends object, Controller extends object>(
        lifecycle: IComponentInstanceLifecycle<Inputs, Controller>,
    ): ComponentInstanceContract<Inputs, Controller> {
        return new ComponentInstance(lifecycle);
    }

    /**
     * @description Reports whether the internal component lifecycle is permanently disposed.
     * @returns Whether the component instance has completed disposal.
     */
    get disposed(): boolean {
        return this.#lifecycle.disposed;
    }

    /**
     * @description Disposes the internal component lifecycle and all of its owned resources.
     * @returns Nothing.
     */
    dispose(): void {
        this.#lifecycle.dispose();
    }
}
