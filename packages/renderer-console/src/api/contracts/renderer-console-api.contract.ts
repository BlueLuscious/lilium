import type { ConsolePrimitiveDefinition } from "../../capability/contracts/console-primitive-definition.contract.js";
import type { ConsolePrimitiveOptionsType } from "../../capability/types/console-primitive-options.type.js";
import type { ConsoleHost } from "../../host/contracts/console-host.contract.js";
import type { ConsoleHostOptionsType } from "../../host/types/console-host-options.type.js";
import type { ConsolePrimitiveType } from "../../host/types/console-primitive.type.js";

/** @description Object-based construction boundary for private Console conformance hosts. */
export interface RendererConsoleApi {
    /**
     * @description Declares one logical implementation for an exact Template primitive identity.
     * @typeParam Primitive - Exact Template primitive identity being implemented.
     * @param primitive - Primitive identity requested by Renderer capability preflight.
     * @param options - Optional supported children and property capabilities.
     * @returns Frozen nominal Console primitive declaration.
     */
    primitive<Primitive extends ConsolePrimitiveType>(
        primitive: Primitive,
        options?: ConsolePrimitiveOptionsType<Primitive>,
    ): ConsolePrimitiveDefinition<Primitive>;

    /**
     * @description Creates one reusable private logical host from complete capabilities.
     * @param options - Complete package-created primitive declaration set.
     * @returns Frozen host implementing the public Renderer protocol.
     */
    createHost(options: ConsoleHostOptionsType): ConsoleHost;
}
