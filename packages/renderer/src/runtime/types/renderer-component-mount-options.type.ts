import type { ComponentInputValuesType } from "@lilium/component";
import type { Scope } from "@lilium/core";

/**
 * @description Complete options for mounting one templated component root.
 * @typeParam Root - External root type accepted by the configured host.
 * @typeParam Inputs - Declarative component input value shape.
 */
export type RendererComponentMountOptionsType<Root, Inputs extends object> = Readonly<{
    /** @description External host root claimed for this rendered application. */
    root: Root;

    /** @description Complete initial component input values. */
    inputs: ComponentInputValuesType<Inputs>;

    /** @description Optional parent Core scope beneath which application ownership is created. */
    owner?: Scope;
}>;
