import type { EffectExecution } from "../contracts/effect-execution.contract.js";

/**
 * @description Synchronous tracked operation executed during the scheduler effect phase.
 * @param execution - Execution-scoped object used to register resource cleanups.
 * @returns `undefined` after synchronous execution completes.
 */
export type EffectFunctionType = (execution: EffectExecution) => undefined;
