/**
 * @description Pure synchronous evaluator for one dynamic template value.
 * @typeParam State - Read-only occurrence state supplied by Renderer.
 * @typeParam Value - Candidate value produced by the evaluator.
 * @param state - Current read-only template occurrence state.
 * @returns The next candidate value for one binding.
 */
export type TemplateBindingEvaluatorType<State extends object, Value> = {
    /**
     * @description Evaluates one candidate value from read-only occurrence state.
     * @param state - Current read-only template occurrence state.
     * @returns The next candidate value for one binding.
     */
    bivarianceHack(state: Readonly<State>): Value;
}["bivarianceHack"];
