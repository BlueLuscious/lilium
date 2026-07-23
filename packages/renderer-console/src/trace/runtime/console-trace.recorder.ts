import type { ConsoleTraceEntryType } from "../types/console-trace-entry.type.js";
import type { ConsoleTraceStatusType } from "../types/console-trace-status.type.js";
import type { TConsoleTracePayload } from "../types/internal/console-trace-payload.type.js";

/** @description Owns one deterministic append-only Console host operation trace. */
export class ConsoleTraceRecorder {
    /** @description Mutable private entries retained in exact observation order. */
    readonly #entries: ConsoleTraceEntryType[] = [];

    /**
     * @description Appends one frozen operation stage with a deterministic sequence number.
     * @param status - Attempted or completed operation stage.
     * @param payload - Operation and normalized numeric identities.
     * @returns Nothing after the entry is appended.
     */
    record(status: ConsoleTraceStatusType, payload: TConsoleTracePayload): void {
        this.#entries.push(
            Object.freeze({
                sequence: this.#entries.length,
                status,
                ...payload,
            }),
        );
    }

    /**
     * @description Returns one frozen copy of every current trace entry.
     * @returns Immutable deterministic operation trace snapshot.
     */
    snapshot(): readonly ConsoleTraceEntryType[] {
        return Object.freeze([...this.#entries]);
    }
}
