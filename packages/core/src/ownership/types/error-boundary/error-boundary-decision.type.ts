/**
 * @description Decision returned by an ownership error boundary handler.
 * @remarks Handled errors stop at the current boundary; propagated errors continue
 * toward the next parent boundary or the synchronous runtime caller.
 */
export type ErrorBoundaryDecisionType = "handled" | "propagate";
