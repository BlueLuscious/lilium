import type { RenderBindingFunctionType } from "../types/render-binding-function.type.js";
import type { RenderBindingTerminalFunctionType } from "../types/render-binding-terminal-function.type.js";
import type { RenderBinding } from "./render-binding.contract.js";

/**
 * @description Runtime-bound capability for creating owned reactive render bindings.
 * @remarks This object delegates tracking, batching, scheduling, cancellation, and error routing
 * to Core without exposing the scheduler, tracker, ownership manager, or phase selection.
 */
export interface RenderBindingRuntime {
    /**
     * @description Creates and synchronously evaluates one binding under the active owner.
     * @remarks Later dependency invalidations are deduplicated and scheduled by Core. A handled
     * initial failure returns `undefined`; a propagated failure throws after terminalization.
     * @param operation - Synchronous tracked render work executed by the binding.
     * @param terminalize - Operation invoked once after failed binding work unwinds.
     * @returns The live binding, or `undefined` when its initial failure was handled.
     */
    create(
        operation: RenderBindingFunctionType,
        terminalize: RenderBindingTerminalFunctionType,
    ): RenderBinding | undefined;

    /**
     * @description Executes one synchronous integration operation without collecting dependencies.
     * @remarks Renderer uses this narrow authority for binding equality and explicit mutation
     * callbacks that must not become reactive dependencies.
     * @typeParam T - Value returned by the untracked operation.
     * @param operation - Synchronous operation executed with dependency collection suspended.
     * @returns The exact operation result.
     */
    untrack<T>(operation: () => T): T;
}
