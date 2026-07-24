import { Component } from "@lilium/component";

/**
 * @typedef {{ initial: number }} CounterInputs
 */

/**
 * @typedef {{
 *     count: import("@lilium/core").Signal<number>;
 *     increment(): void;
 * }} CounterController
 */

/** @type {import("@lilium/component").ComponentDefinition<CounterInputs, CounterController>} */
export const CounterBehavior = Component.define({
    setup(context, inputs) {
        const count = context.runtime.signal(inputs.initial.get());

        return {
            count,
            increment() {
                count.update((value) => value + 1);
            },
        };
    },
});
