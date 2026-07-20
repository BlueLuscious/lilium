import type { RenderedApplication } from "./rendered-application.contract.js";

/**
 * @description Public lifecycle handle for one mounted standalone Template definition.
 * @typeParam State - Read-only state object retained by the template occurrence.
 */
export interface RenderedTemplate<State extends object> extends RenderedApplication {
    /** @description Exact occurrence state supplied during mounting, exposed read-only. */
    readonly state: Readonly<State>;
}
