import type { RendererHostOperationType } from "@lilium/renderer";
import type { ConsoleTraceStatusType } from "./console-trace-status.type.js";

/**
 * @description Deterministic serializable observation of one Console host operation stage.
 * @remarks Optional numeric identities are present only when relevant to the operation. Entries
 * contain no object references, timestamps, process data, platform values, or property candidates.
 */
export type ConsoleTraceEntryType = Readonly<{
    /** @description Zero-based position in the exact session trace. */
    sequence: number;

    /** @description Whether the operation began or completed successfully. */
    status: ConsoleTraceStatusType;

    /** @description Exact public Renderer host operation. */
    operation: RendererHostOperationType;

    /** @description Deterministic root-handle identifier for open and close operations. */
    root?: number;

    /** @description Deterministic primitive capability identifier when applicable. */
    primitive?: number;

    /** @description Deterministic property capability identifier when applicable. */
    property?: number;

    /** @description Deterministic value-handle identifier when applicable. */
    value?: number;

    /** @description Deterministic destination or current parent-handle identifier. */
    parent?: number;

    /** @description Deterministic sibling anchor identifier, or null for ordered append. */
    before?: number | null;

    /** @description Deterministic previous parent identifier, or null while detached. */
    currentParent?: number | null;
}>;
