import type { RendererHostOperationType } from "@lilium/renderer";
import type { ConsoleFailureInjectionType } from "../types/console-failure-injection.type.js";

/** @description Complete accepted Renderer host operation vocabulary. */
const CONSOLE_HOST_OPERATIONS: readonly RendererHostOperationType[] = Object.freeze([
    "open",
    "resolve-primitive",
    "resolve-property",
    "create",
    "write",
    "place",
    "remove",
    "release",
    "close",
]);

/** @description Reproduces configured failures from deterministic per-session attempt counts. */
export class ConsoleFailureInjector {
    /** @description Frozen normalized failure definitions shared safely across sessions. */
    readonly #injections: readonly Required<ConsoleFailureInjectionType>[];
    /** @description Attempt counts keyed by exact Renderer operation. */
    readonly #occurrences = new Map<RendererHostOperationType, number>();

    /**
     * @description Normalizes one host-level failure injection plan.
     * @param injections - Optional immutable operation failure requests.
     * @returns Frozen definitions with explicit occurrences.
     */
    static normalize(
        injections: readonly ConsoleFailureInjectionType[] | undefined,
    ): readonly Required<ConsoleFailureInjectionType>[] {
        if (injections === undefined) {
            return Object.freeze([]);
        }

        if (!Array.isArray(injections)) {
            throw new TypeError("Console failure injections must be an array.");
        }

        const normalized: Required<ConsoleFailureInjectionType>[] = [];
        const positions = new Set<string>();

        for (const injection of injections) {
            if (typeof injection !== "object" || injection === null || Array.isArray(injection)) {
                throw new TypeError("Each Console failure injection must be an object.");
            }

            if (!CONSOLE_HOST_OPERATIONS.includes(injection.operation)) {
                throw new TypeError("Console failure injection operation is unsupported.");
            }

            const occurrence = injection.occurrence ?? 1;
            if (!Number.isSafeInteger(occurrence) || occurrence < 1) {
                throw new TypeError("Console failure occurrence must be a positive safe integer.");
            }

            if (!("error" in injection)) {
                throw new TypeError("Console failure injection must define an error value.");
            }

            const position = `${injection.operation}:${occurrence}`;
            if (positions.has(position)) {
                throw new TypeError(
                    "A Console operation occurrence cannot inject multiple failures.",
                );
            }

            positions.add(position);
            normalized.push(Object.freeze({ ...injection, occurrence }));
        }

        return Object.freeze(normalized);
    }

    /**
     * @description Creates one fresh per-session occurrence counter from a normalized plan.
     * @param injections - Frozen normalized host-level failure definitions.
     */
    constructor(injections: readonly Required<ConsoleFailureInjectionType>[]) {
        this.#injections = injections;
    }

    /**
     * @description Counts one attempt and throws its exact scheduled failure when matched.
     * @param operation - Exact Renderer host operation being attempted.
     * @returns Nothing when this occurrence has no injected failure.
     */
    throwIfScheduled(operation: RendererHostOperationType): void {
        const occurrence = (this.#occurrences.get(operation) ?? 0) + 1;
        this.#occurrences.set(operation, occurrence);
        const injection = this.#injections.find(
            (candidate) => candidate.operation === operation && candidate.occurrence === occurrence,
        );

        if (injection !== undefined) {
            throw injection.error;
        }
    }
}
