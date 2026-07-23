import type { ConsolePrimitiveDefinition } from "../../../capability/contracts/console-primitive-definition.contract.js";
import type { ConsoleHandleType } from "../console-handle.type.js";
import type { ConsolePropertyType } from "../console-property.type.js";

/** @description Mutable private state associated with one opaque logical Console handle. */
export type TConsoleHandleRecord = {
    /** @description Deterministic session-local diagnostic identifier. */
    readonly id: number;

    /** @description Creating primitive declaration, or undefined for the session root handle. */
    readonly primitive: ConsolePrimitiveDefinition | undefined;

    /** @description Ordered immediate logical children. */
    readonly children: ConsoleHandleType[];

    /** @description Latest committed values keyed by exact property identity. */
    readonly properties: Map<ConsolePropertyType, unknown>;

    /** @description Current immediate parent, or undefined while detached. */
    parent: ConsoleHandleType | undefined;

    /** @description Whether the value has been permanently released. */
    released: boolean;
};
