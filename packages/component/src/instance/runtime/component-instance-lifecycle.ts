import type { Scope } from "@lilium/core";
import type { ComponentControllerType } from "../../controller/types/component-controller.type.js";
import type { ComponentInputStore } from "../../inputs/runtime/component-input.store.js";
import type { ComponentInputValuesType } from "../../inputs/types/component-input-values.type.js";
import type { ComponentInputsType } from "../../inputs/types/component-inputs.type.js";
import type { IComponentInstanceLifecycle } from "../contracts/internal/component-instance-lifecycle.contract.js";

/**
 * @description Internal initialized lifecycle behind one public component instance.
 * @remarks Construction occurs only after setup succeeds. The instance remains frozen while
 * private disposal state follows its component scope and mutable inputs remain internal.
 * @typeParam Inputs - Declarative input value shape of the component.
 * @typeParam Controller - Public object shape returned by component setup.
 */
export class ComponentInstanceLifecycle<Inputs extends object, Controller extends object>
    implements IComponentInstanceLifecycle<Inputs, Controller>
{
    /** @description Whether this lifecycle has already created its unique attachment scope. */
    #attachmentCreated = false;

    /** @description Whether the component scope has begun or completed disposal. */
    #disposed = false;

    /** @description Internal mutable input storage retained for lifecycle updates. */
    readonly #inputStore: ComponentInputStore<Inputs>;

    /** @description Component ownership scope disposed by this lifecycle. */
    readonly #scope: Scope;

    /** @description Read-only controller returned by successful component setup. */
    readonly controller: ComponentControllerType<Controller>;

    /** @description Stable read-only reactive inputs shared with component setup. */
    readonly inputs: ComponentInputsType<Inputs>;

    /**
     * @description Creates a frozen initialized lifecycle and registers scope disposal state.
     * @param scope - Dedicated component scope that owns setup resources and input signals.
     * @param controller - Public read-only controller returned by successful setup.
     * @param inputStore - Mutable input storage created before setup in the component scope.
     */
    constructor(
        scope: Scope,
        controller: ComponentControllerType<Controller>,
        inputStore: ComponentInputStore<Inputs>,
    ) {
        this.#scope = scope;
        this.controller = controller;
        this.#inputStore = inputStore;
        this.inputs = inputStore.inputs;
        scope.cleanup(() => {
            this.#disposed = true;
            return undefined;
        });
        Object.freeze(this);
    }

    /**
     * @description Reports whether the component scope has entered disposal.
     * @returns Whether this component lifecycle has begun or completed disposal.
     */
    get disposed(): boolean {
        return this.#disposed;
    }

    /**
     * @description Creates the unique attachment child beneath the private component scope.
     * @returns A child scope dedicated to presentation resources.
     */
    createAttachment(): Scope {
        if (this.#disposed) {
            throw new Error("Cannot attach a disposed component instance.");
        }

        if (this.#attachmentCreated) {
            throw new Error("A component instance already has an attachment scope.");
        }

        const attachment = this.#scope.child();
        this.#attachmentCreated = true;
        return attachment;
    }

    /**
     * @description Disposes the component scope and every resource it owns.
     * @remarks Repeated disposal is safe. Scope disposal errors retain Core semantics while
     * the registered lifecycle cleanup permanently marks this instance as disposed.
     * @returns Nothing.
     */
    dispose(): void {
        if (this.#disposed) {
            return;
        }

        this.#scope.dispose();
    }

    /**
     * @description Applies one complete normalized input snapshot to this instance.
     * @param values - Complete next input values, including optional keys as `undefined`.
     * @returns Nothing.
     */
    updateInputs(values: ComponentInputValuesType<Inputs>): void {
        if (this.#disposed) {
            throw new Error("Cannot update inputs on a disposed component instance.");
        }

        this.#inputStore.update(values);
    }
}
