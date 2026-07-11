import type {
    ErrorBoundary,
    ErrorBoundaryDecisionType,
    ErrorBoundaryEvent,
    ErrorBoundaryFunctionType,
    Scope,
} from "../../../src/index.js";

declare const event: ErrorBoundaryEvent;
declare const scope: Scope;

const handler: ErrorBoundaryFunctionType = (currentEvent) => {
    const error: unknown = currentEvent.error;
    const owner: Scope | null = currentEvent.owner;

    void error;
    void owner;

    return "handled";
};

const boundary: ErrorBoundary = scope.boundary(handler);
const boundaryScope: Scope = boundary;
const decision: ErrorBoundaryDecisionType = "propagate";

scope.boundary(() => "handled");
scope.boundary(() => "propagate");

// @ts-expect-error Error boundary handlers must be synchronous.
scope.boundary(async () => "handled" as const);

// @ts-expect-error Retry is not an error boundary decision.
scope.boundary(() => "retry");

// @ts-expect-error A plain scope is not an error boundary handle.
const plainScopeBoundary: ErrorBoundary = scope;

void boundaryScope;
void decision;
void event;
void plainScopeBoundary;
