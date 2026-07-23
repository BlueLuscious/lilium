import type { RendererHostOperationType } from "../../error/types/renderer-host-operation.type.js";

/** @description Portable deterministic failure requested by one conformance scenario. */
export type RendererConformanceFailureType = Readonly<{
    /** @description Host operation whose attempt must throw. */
    operation: RendererHostOperationType;

    /** @description Positive one-based operation occurrence, defaulting to one. */
    occurrence?: number;

    /** @description Exact error value that the host must throw. */
    error: unknown;
}>;
