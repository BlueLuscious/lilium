import type { ReadonlySignal } from "@lilium/core";
import type { TComponentInputValue } from "./internal/component-input-value.type.js";

/**
 * @description Read-only reactive input object received by headless component setup.
 * @remarks Every declared input key exists as a read-only signal. Optional input
 * declarations expose `undefined` through their signal value rather than omitting the key.
 * @typeParam Inputs - Declarative input value shape of the component.
 */
export type ComponentInputsType<Inputs extends object> = {
    readonly [Key in keyof Inputs]-?: ReadonlySignal<TComponentInputValue<Inputs, Key>>;
};
