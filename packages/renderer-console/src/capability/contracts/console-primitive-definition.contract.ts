import type { ConsolePrimitiveType } from "../../host/types/console-primitive.type.js";
import type { ConsolePropertyType } from "../../host/types/console-property.type.js";

/**
 * @description Immutable logical host implementation declaration for one exact Template primitive.
 * @typeParam Primitive - Exact primitive identity implemented by this declaration.
 */
export interface ConsolePrimitiveDefinition<
    Primitive extends ConsolePrimitiveType = ConsolePrimitiveType,
> {
    /** @description Exact Template primitive identity supported by the logical host. */
    readonly primitive: Primitive;

    /** @description Whether values created from this primitive may receive logical children. */
    readonly acceptsChildren: boolean;

    /** @description Ordered unique property identities supported for this primitive. */
    readonly properties: readonly ConsolePropertyType<Primitive>[];
}
