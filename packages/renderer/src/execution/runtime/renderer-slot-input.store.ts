import type { ReactiveRuntime, ReadonlySignal, Signal } from "@lilium/core";
import type { TemplateSlotInputsType, TemplateSlotInputValuesType } from "@lilium/template";
import { RendererSlotInputSignal } from "./renderer-slot-input-signal.js";

/**
 * @description Owns mutable Core signals behind one stable read-only projection slot state.
 * @typeParam Inputs - Complete slot-input value shape.
 */
export class RendererSlotInputStore<Inputs extends object> {
    /** @description Reactive runtime used for signal creation and complete batched updates. */
    readonly #runtime: ReactiveRuntime;
    /** @description Mutable slot-input signals indexed by the normalized initial key set. */
    readonly #signals = new Map<PropertyKey, Signal<unknown>>();
    /** @description Stable frozen read-only slot-input object exposed to projected content. */
    readonly inputs: TemplateSlotInputsType<Inputs>;

    /**
     * @description Creates every private signal from one complete initial slot snapshot.
     * @param runtime - Reactive runtime owning the projection scope and its signals.
     * @param values - Complete initial slot-input value snapshot.
     */
    constructor(runtime: ReactiveRuntime, values: TemplateSlotInputValuesType<Inputs>) {
        this.#assertRecord(values);
        this.#runtime = runtime;
        const inputs = Object.create(null) as Record<PropertyKey, ReadonlySignal<unknown>>;

        for (const key of Reflect.ownKeys(values)) {
            const signal = runtime.signal(values[key as keyof Inputs]);
            this.#signals.set(key, signal as Signal<unknown>);
            Object.defineProperty(inputs, key, {
                configurable: false,
                enumerable: true,
                value: new RendererSlotInputSignal(signal),
                writable: false,
            });
        }

        this.inputs = Object.freeze(inputs) as TemplateSlotInputsType<Inputs>;
        Object.freeze(this);
    }

    /**
     * @description Applies one complete slot snapshot through a single Core batch boundary.
     * @param values - Complete candidate snapshot with the exact initial key set.
     * @returns Nothing after every accepted signal write and synchronous flush complete.
     */
    update(values: TemplateSlotInputValuesType<Inputs>): void {
        this.#assertRecord(values);
        const keys = Reflect.ownKeys(values);

        if (keys.length !== this.#signals.size || keys.some((key) => !this.#signals.has(key))) {
            throw new TypeError("Slot input updates require the complete initial key set.");
        }

        const updates: Array<readonly [Signal<unknown>, unknown]> = [];

        for (const [key, signal] of this.#signals) {
            updates.push([signal, values[key as keyof Inputs]]);
        }

        this.#runtime.batch(() => {
            for (const [signal, value] of updates) {
                signal.set(value);
            }
        });
    }

    /**
     * @description Rejects malformed snapshots before key inspection or signal creation.
     * @param values - Candidate initial or update snapshot.
     * @returns Nothing when the candidate is a non-array object.
     */
    #assertRecord(values: TemplateSlotInputValuesType<Inputs>): void {
        if (typeof values !== "object" || values === null || Array.isArray(values)) {
            throw new TypeError("Slot input values must be a non-array object.");
        }
    }
}
