import type { Scope } from "@lilium/core";

/**
 * @description Complete options for mounting one standalone Template definition.
 * @typeParam Root - External root type accepted by the configured host.
 * @typeParam State - Read-only state object supplied to the Template occurrence.
 */
export type RendererTemplateMountOptionsType<Root, State extends object> = Readonly<{
    /** @description External host root claimed for this rendered application. */
    root: Root;

    /** @description Exact state object retained and evaluated by the Template occurrence. */
    state: State;

    /** @description Optional parent Core scope beneath which application ownership is created. */
    owner?: Scope;
}>;
