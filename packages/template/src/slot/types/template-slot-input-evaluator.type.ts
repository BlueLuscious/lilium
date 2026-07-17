import type { TemplateSlotInputValuesType } from "./template-slot-input-values.type.js";

/**
 * @description Pure synchronous evaluator producing one complete slot-input snapshot.
 * @typeParam State - Read-only state of the receiving child template.
 * @typeParam Inputs - Complete value shape accepted by the slot.
 * @param state - Current read-only child template state.
 * @returns A complete slot-input value snapshot.
 */
export type TemplateSlotInputEvaluatorType<State extends object, Inputs extends object> = {
    /**
     * @description Evaluates one complete slot-input snapshot.
     * @param state - Current read-only child template state.
     * @returns A complete slot-input value snapshot.
     */
    bivarianceHack(state: Readonly<State>): TemplateSlotInputValuesType<Inputs>;
}["bivarianceHack"];
