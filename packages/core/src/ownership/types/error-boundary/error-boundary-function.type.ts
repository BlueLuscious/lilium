import type { ErrorBoundaryEvent } from "../../contracts/error-boundary/error-boundary-event.contract.js";
import type { ErrorBoundaryDecisionType } from "./error-boundary-decision.type.js";

/**
 * @description Synchronous untracked handler for a failure in an owned subtree.
 * @param event - Immutable event containing the error and its nearest owner.
 * @returns Whether the failure is handled or must propagate to a parent boundary.
 */
export type ErrorBoundaryFunctionType = (event: ErrorBoundaryEvent) => ErrorBoundaryDecisionType;
