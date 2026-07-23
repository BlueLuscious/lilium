import type { ReadonlySignal } from "@lilium/core";

/**
 * @description Read-only runtime wrapper around one private mutable slot-input signal.
 * @typeParam T - Slot input value exposed to projected Template content.
 */
export class RendererSlotInputSignal<T> implements ReadonlySignal<T> {
    /** @description Underlying Core signal exposed only through its tracked read capability. */
    readonly #source: ReadonlySignal<T>;

    /**
     * @description Creates one immutable read-only slot-input signal view.
     * @param source - Core signal whose mutation authority remains private to Renderer.
     */
    constructor(source: ReadonlySignal<T>) {
        this.#source = source;
        Object.freeze(this);
    }

    /**
     * @description Reads and tracks the current slot-input value.
     * @returns Current value stored by the underlying Core signal.
     */
    get(): T {
        return this.#source.get();
    }
}
