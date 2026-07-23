import type { ConsolePrimitiveType } from "../types/console-primitive.type.js";
import type { ConsolePropertySnapshotType } from "../types/console-property-snapshot.type.js";

/** @description Immutable recursive observation of one live logical Console value. */
export interface ConsoleValueSnapshot {
    /** @description Deterministic session-local value identifier. */
    readonly id: number;

    /** @description Exact Template primitive identity that created the value. */
    readonly primitive: ConsolePrimitiveType;

    /** @description Ordered latest property candidates. */
    readonly properties: readonly ConsolePropertySnapshotType[];

    /** @description Ordered recursive logical children. */
    readonly children: readonly ConsoleValueSnapshot[];
}
