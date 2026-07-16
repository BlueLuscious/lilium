import type { ReadonlySignal } from "@lilium/core";
import type { TemplateSlotInputValuesType } from "./template-slot-input-values.type.js";

/**
 * @description Stable read-only reactive slot inputs exposed to projected content.
 * @typeParam Inputs - Declarative slot input value shape.
 */
export type TemplateSlotInputsType<Inputs extends object> = {
    readonly [Key in keyof Inputs]-?: ReadonlySignal<TemplateSlotInputValuesType<Inputs>[Key]>;
};
