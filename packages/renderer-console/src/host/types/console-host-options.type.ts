import type { ConsolePrimitiveDefinition } from "../../capability/contracts/console-primitive-definition.contract.js";
import type { ConsoleFailureInjectionType } from "../../failure/types/console-failure-injection.type.js";
import type { ConsolePrimitiveType } from "./console-primitive.type.js";
import type { ConsolePropertyType } from "./console-property.type.js";

/** @description Immutable capability set used to create one reusable logical Console host. */
export type ConsoleHostOptionsType = Readonly<{
    /** @description Complete unique primitive capability declarations accepted by the host. */
    primitives: readonly ConsolePrimitiveDefinition[];

    /** @description Configured primitive identities resolved as unsupported during preflight. */
    omittedPrimitives?: readonly ConsolePrimitiveType[];

    /** @description Configured property identities resolved as unsupported during preflight. */
    omittedProperties?: readonly ConsolePropertyType[];

    /** @description Deterministic operation-specific failures reset for each opening attempt. */
    failures?: readonly ConsoleFailureInjectionType[];
}>;
