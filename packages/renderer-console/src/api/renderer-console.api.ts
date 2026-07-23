import type { ConsolePrimitiveDefinition } from "../capability/contracts/console-primitive-definition.contract.js";
import { ConsolePrimitiveFactory } from "../capability/runtime/console-primitive.factory.js";
import { ConsolePrimitiveRegistry } from "../capability/runtime/console-primitive.registry.js";
import type { ConsolePrimitiveOptionsType } from "../capability/types/console-primitive-options.type.js";
import type { ConsoleHost as ConsoleHostContract } from "../host/contracts/console-host.contract.js";
import { ConsoleHost } from "../host/runtime/console-host.js";
import type { ConsoleHostOptionsType } from "../host/types/console-host-options.type.js";
import type { ConsolePrimitiveType } from "../host/types/console-primitive.type.js";
import type { RendererConsoleApi } from "./contracts/renderer-console-api.contract.js";

/** @description Package-local nominal registry shared by declaration and host creation operations. */
const consolePrimitives = new ConsolePrimitiveRegistry();

/** @description Package-local immutable primitive declaration factory. */
const consolePrimitiveFactory = new ConsolePrimitiveFactory(consolePrimitives);

/** @description Frozen object facade for private logical Renderer host construction. */
export const RendererConsole: RendererConsoleApi = Object.freeze({
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
    ): ConsolePrimitiveDefinition<Primitive> {
        return consolePrimitiveFactory.create(primitive, options);
    },

    /**
     * @description Creates one reusable private logical host from complete capabilities.
     * @param options - Complete package-created primitive declaration set.
     * @returns Frozen host implementing the public Renderer protocol.
     */
    createHost(options: ConsoleHostOptionsType): ConsoleHostContract {
        return ConsoleHost.create(options, consolePrimitives);
    },
});
