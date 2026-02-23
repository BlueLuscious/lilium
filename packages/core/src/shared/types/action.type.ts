import type { Action } from "../contracts/action.contract";


/**
 * @description Public non-generic alias for the default {@link Action} shape.
 * @remarks Useful when strict action typing is not required.
 */
export type ActionType = Action<string, unknown, unknown>;
