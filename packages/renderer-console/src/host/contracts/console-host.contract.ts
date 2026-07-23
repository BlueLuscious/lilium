import type { RendererHost, RendererHostOperationType } from "@lilium/renderer";
import type { ConsoleHandleType } from "../types/console-handle.type.js";
import type { ConsoleRootType } from "../types/console-root.type.js";
import type { ConsoleRootSnapshot } from "./console-root-snapshot.contract.js";

/**
 * @description Private logical host plus read-only conformance observations.
 * @remarks Renderer consumes only the inherited public host protocol. Snapshot and trace access
 * exist solely for workspace tests and diagnostics.
 */
export interface ConsoleHost
    extends RendererHost<ConsoleRootType, ConsoleHandleType, ConsoleHandleType> {
    /**
     * @description Captures the current logical tree for one active root session.
     * @param root - Exact active external root identity.
     * @returns A deeply immutable recursive logical tree snapshot.
     */
    snapshot(root: ConsoleRootType): ConsoleRootSnapshot;

    /**
     * @description Captures successful protocol operations for one current or completed root.
     * @param root - Exact external root identity previously supplied to this host.
     * @returns Immutable ordered operation names.
     */
    trace(root: ConsoleRootType): readonly RendererHostOperationType[];
}
