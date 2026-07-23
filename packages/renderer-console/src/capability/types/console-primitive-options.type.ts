import type { ConsolePrimitiveType } from "../../host/types/console-primitive.type.js";
import type { ConsolePropertyType } from "../../host/types/console-property.type.js";

/**
 * @description Optional logical host behavior declared for one exact Template primitive.
 * @typeParam Primitive - Exact primitive identity receiving the options.
 */
export type ConsolePrimitiveOptionsType<Primitive extends ConsolePrimitiveType> = Readonly<{
    /** @description Whether created values may receive logical children. */
    acceptsChildren?: boolean;

    /** @description Exact property identities supported by the primitive. */
    properties?: readonly ConsolePropertyType<Primitive>[];
}>;
