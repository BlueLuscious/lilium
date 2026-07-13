import type { ReactiveRuntime, ReadonlySignal, Signal } from "@lilium/core";
import type { ComponentInputValuesType } from "../types/component-input-values.type.js";
import type { ComponentInputsType } from "../types/component-inputs.type.js";
import { ComponentInputSignal } from "./component-input-signal.js";

/**
 * @description Internal mutable storage for one component's normalized reactive inputs.
 * @remarks Construction must occur while the component scope is active so every mutable
 * Core signal belongs to that scope. Consumers receive only frozen read wrappers.
 * @typeParam Inputs - Declarative input value shape of the component.
 */
export class ComponentInputStore<Inputs extends object> {
    /** @description Reactive runtime used to create signals and batch complete updates. */
    readonly #runtime: ReactiveRuntime;

    /** @description Mutable Core input signals indexed by their normalized property keys. */
    readonly #signals = new Map<PropertyKey, Signal<unknown>>();

    /** @description Stable frozen object containing runtime read-only input signals. */
    readonly inputs: ComponentInputsType<Inputs>;

    /**
     * @description Creates mutable signals and their stable read-only public wrappers.
     * @param runtime - Reactive runtime owning the component scope and input signals.
     * @param values - Complete normalized initial component input snapshot.
     */
    constructor(runtime: ReactiveRuntime, values: ComponentInputValuesType<Inputs>) {
        this.#runtime = runtime;
        const inputs = Object.create(null) as Record<PropertyKey, ReadonlySignal<unknown>>;

        for (const key of Reflect.ownKeys(values)) {
            const signal = runtime.signal(values[key as keyof Inputs]);
            this.#signals.set(key, signal as Signal<unknown>);
            Object.defineProperty(inputs, key, {
                configurable: false,
                enumerable: true,
                value: new ComponentInputSignal(signal),
                writable: false,
            });
        }

        this.inputs = Object.freeze(inputs) as ComponentInputsType<Inputs>;
        Object.freeze(this);
    }

    /**
     * @description Applies one complete normalized snapshot through a single batch boundary.
     * @remarks Snapshot values are captured before any write so accessor failures cannot
     * leave a partially updated input store. Core batching controls reactive observation.
     * @param values - Complete next component input values with the original key set.
     * @returns Nothing.
     */
    update(values: ComponentInputValuesType<Inputs>): void {
        this.#assertComplete(values);
        const updates: Array<readonly [Signal<unknown>, unknown]> = [];

        for (const [key, signal] of this.#signals) {
            updates.push([signal, values[key as keyof Inputs]]);
        }

        this.#runtime.batch(() => {
            for (const [signal, value] of updates) {
                signal.set(value);
            }

            return undefined;
        });
    }

    /**
     * @description Verifies that an update contains exactly the normalized initial key set.
     * @param values - Candidate complete input snapshot.
     * @returns Nothing when every expected key appears exactly once and no extra key exists.
     */
    #assertComplete(values: ComponentInputValuesType<Inputs>): void {
        const keys = Reflect.ownKeys(values);

        if (keys.length !== this.#signals.size || keys.some((key) => !this.#signals.has(key))) {
            throw new TypeError("Component input updates require the complete normalized key set.");
        }
    }
}
