import type { ConsolePropertyType } from "./console-property.type.js";

/** @description Immutable observed property value from one logical Console value snapshot. */
export type ConsolePropertySnapshotType = Readonly<{
    /** @description Exact Template property identity that received the write. */
    property: ConsolePropertyType;

    /** @description Last candidate committed through the Renderer host protocol. */
    value: unknown;
}>;
