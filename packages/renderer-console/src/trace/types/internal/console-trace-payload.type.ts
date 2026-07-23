import type { ConsoleTraceEntryType } from "../console-trace-entry.type.js";

/** @description Internal trace payload before recorder-owned sequence and status enrichment. */
export type TConsoleTracePayload = Omit<ConsoleTraceEntryType, "sequence" | "status">;
