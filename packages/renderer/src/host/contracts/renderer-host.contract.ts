import type { RendererHostSession } from "./renderer-host-session.contract.js";

/**
 * @description Reusable target adapter that opens exclusive rendering sessions.
 * @typeParam Root - External target root supplied by an application.
 * @typeParam Parent - Opaque host handle that may receive placed values.
 * @typeParam Value - Opaque host value handle created by primitive capabilities.
 */
export interface RendererHost<Root, Parent extends object, Value extends Parent> {
    /**
     * @description Claims one external root and opens its synchronous host session.
     * @remarks A failed operation must leave the root unclaimed and allocate no reusable session.
     * @param root - Externally owned target root to claim exclusively.
     * @returns A new exclusive session wrapping the root in an opaque parent handle.
     */
    open(root: Root): RendererHostSession<Parent, Value>;
}
