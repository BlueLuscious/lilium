import type { ConsolePrimitiveDefinition } from "../../capability/contracts/console-primitive-definition.contract.js";

/** @description Immutable capability set used to create one reusable logical Console host. */
export type ConsoleHostOptionsType = Readonly<{
    /** @description Complete unique primitive capability declarations accepted by the host. */
    primitives: readonly ConsolePrimitiveDefinition[];
}>;
