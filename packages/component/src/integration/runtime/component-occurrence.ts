import type { Scope } from "@lilium/core";
import type { ComponentInputValuesType } from "../../inputs/types/component-input-values.type.js";
import type { ComponentInstance as ComponentInstanceContract } from "../../instance/contracts/component-instance.contract.js";
import type { IComponentInstanceLifecycle } from "../../instance/contracts/internal/component-instance-lifecycle.contract.js";
import { ComponentInstance } from "../../instance/runtime/component-instance.js";
import type { ComponentOccurrence as ComponentOccurrenceContract } from "../contracts/component-occurrence.contract.js";

/**
 * @description Protected public occurrence retaining Renderer authority over one component.
 * @remarks The frozen object exposes the public instance and attachment scope while keeping the
 * mutable component lifecycle, input store, and private component scope behind native fields.
 * @typeParam Inputs - Declarative input value shape of the component.
 * @typeParam Controller - Public object shape returned by component setup.
 */
export class ComponentOccurrence<Inputs extends object, Controller extends object>
    implements ComponentOccurrenceContract<Inputs, Controller>
{
    /** @description Internal mutable lifecycle hidden from adapter consumers. */
    readonly #lifecycle: IComponentInstanceLifecycle<Inputs, Controller>;

    /** @description Dedicated scope owning presentation and host attachment resources. */
    readonly attachment: Scope;

    /** @description Stable protected public view of the headless component instance. */
    readonly instance: ComponentInstanceContract<Inputs, Controller>;

    /**
     * @description Creates a protected occurrence from one successfully initialized lifecycle.
     * @typeParam Inputs - Declarative input value shape of the component.
     * @typeParam Controller - Public object shape returned by component setup.
     * @param lifecycle - Internal lifecycle retaining input and component ownership authority.
     * @returns A frozen occurrence with one newly created attachment scope.
     */
    static create<Inputs extends object, Controller extends object>(
        lifecycle: IComponentInstanceLifecycle<Inputs, Controller>,
    ): ComponentOccurrenceContract<Inputs, Controller> {
        const attachment = lifecycle.createAttachment();
        const instance = ComponentInstance.create(lifecycle);
        return new ComponentOccurrence(lifecycle, attachment, instance);
    }

    /**
     * @description Constructs and freezes one protected component occurrence.
     * @param lifecycle - Internal lifecycle receiving delegated mutation and disposal.
     * @param attachment - Unique presentation child beneath the private component scope.
     * @param instance - Protected public component instance view.
     */
    private constructor(
        lifecycle: IComponentInstanceLifecycle<Inputs, Controller>,
        attachment: Scope,
        instance: ComponentInstanceContract<Inputs, Controller>,
    ) {
        this.#lifecycle = lifecycle;
        this.attachment = attachment;
        this.instance = instance;
        Object.freeze(this);
    }

    /**
     * @description Disposes attachment resources and the complete component lifecycle.
     * @returns Nothing.
     */
    dispose(): void {
        this.#lifecycle.dispose();
    }

    /**
     * @description Applies one complete input snapshot through the hidden mutable lifecycle.
     * @param values - Complete next values including explicit `undefined` optional inputs.
     * @returns Nothing.
     */
    updateInputs(values: ComponentInputValuesType<Inputs>): void {
        this.#lifecycle.updateInputs(values);
    }
}
