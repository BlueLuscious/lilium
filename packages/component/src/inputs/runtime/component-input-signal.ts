import type { ReadonlySignal } from "@lilium/core";

/**
 * @description Internal read-only wrapper around one mutable component input signal.
 * @remarks The wrapper erases write operations at runtime, not only through TypeScript,
 * while preserving tracked reads from the underlying Core signal.
 * @typeParam T - Value exposed by the component input.
 */
export class ComponentInputSignal<T> implements ReadonlySignal<T> {
    /** @description Underlying read capability delegated to by this wrapper. */
    readonly #source: ReadonlySignal<T>;

    /**
     * @description Creates one frozen read-only component input signal.
     * @param source - Core signal read capability hidden behind this wrapper.
     */
    constructor(source: ReadonlySignal<T>) {
        this.#source = source;
        Object.freeze(this);
    }

    /**
     * @description Reads and tracks the current underlying input value.
     * @returns The current component input value.
     */
    get(): T {
        return this.#source.get();
    }
}
