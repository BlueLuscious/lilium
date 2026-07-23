import type { RendererHostOperationType } from "../../error/types/renderer-host-operation.type.js";
import type { RendererHost } from "../../host/contracts/renderer-host.contract.js";
import type { RendererConformanceRootType } from "../types/renderer-conformance-root.type.js";
import type { RendererConformanceValueSnapshotType } from "../types/renderer-conformance-value-snapshot.type.js";

/** @description Host protocol implementation with normalized read-only conformance observations. */
export interface RendererConformanceHost {
    /** @description Concrete host consumed only through the universal Renderer protocol. */
    readonly host: RendererHost<RendererConformanceRootType, object, object>;

    /**
     * @description Lists attempted operations for one current or completed root session.
     * @param root - Exact external root supplied to Renderer.
     * @returns Operations in protocol invocation order, including failed attempts.
     */
    operations(root: RendererConformanceRootType): readonly RendererHostOperationType[];

    /**
     * @description Lists successfully completed operations for one current or completed session.
     * @param root - Exact external root supplied to Renderer.
     * @returns Operations in successful completion order.
     */
    completedOperations(root: RendererConformanceRootType): readonly RendererHostOperationType[];

    /**
     * @description Captures the active logical children of one external root.
     * @param root - Exact active external root supplied to Renderer.
     * @returns Normalized recursive values preserving capability identities and order.
     */
    snapshot(root: RendererConformanceRootType): readonly RendererConformanceValueSnapshotType[];
}
