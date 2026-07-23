import type { RendererHostSession } from "@lilium/renderer";
import type { ConsoleHandleType } from "./console-handle.type.js";

/** @description Public Renderer primitive identity accepted by Console capability declarations. */
export type ConsolePrimitiveType = Parameters<
    RendererHostSession<ConsoleHandleType, ConsoleHandleType>["resolvePrimitive"]
>[0];
