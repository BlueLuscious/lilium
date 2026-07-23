import type { RendererHostOperationType } from "@lilium/renderer";

/** @description Immutable request to throw one exact error at a deterministic operation attempt. */
export type ConsoleFailureInjectionType = Readonly<{
    /** @description Renderer host operation whose attempt receives the failure. */
    operation: RendererHostOperationType;

    /** @description Positive one-based operation occurrence; omission selects the first. */
    occurrence?: number;

    /** @description Exact opaque value thrown when the configured occurrence is reached. */
    error: unknown;
}>;
