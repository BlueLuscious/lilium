import type { ConsolePrimitiveType } from "./console-primitive.type.js";

/**
 * @description Structural public property identity accepted by one Console primitive declaration.
 * @typeParam Primitive - Exact primitive identity that owns the property.
 */
export type ConsolePropertyType<Primitive extends ConsolePrimitiveType = ConsolePrimitiveType> =
    Readonly<{
        /** @description Optional Template diagnostic name. */
        name: string | undefined;

        /** @description Exact primitive identity owning this property. */
        primitive: Primitive;
    }>;
