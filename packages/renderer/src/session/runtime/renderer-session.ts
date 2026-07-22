import type { TemplateDefinition, TemplatedComponentDefinition } from "@lilium/template";
import { RendererProtocolError } from "../../error/runtime/renderer-protocol.error.js";
import type { RendererHostSession } from "../../host/contracts/renderer-host-session.contract.js";
import { RendererCapabilityPreflight } from "../../preflight/runtime/renderer-capability.preflight.js";
import type { RendererCapabilityRegistry } from "../../preflight/runtime/renderer-capability.registry.js";
import { RendererRequirementCollector } from "../../preflight/runtime/renderer-requirement.collector.js";
import type { TRendererSessionState } from "../types/internal/renderer-session-state.type.js";

/**
 * @description Renderer-owned lifecycle wrapper for one exclusive host session.
 * @typeParam Parent - Host value shape that can contain rendered values.
 * @typeParam Value - Concrete host value shape created by primitive capabilities.
 */
export class RendererSession<Parent extends object, Value extends Parent> {
    /** @description Exclusive host session owned by this lifecycle wrapper. */
    readonly #host: RendererHostSession<Parent, Value>;
    /** @description Idempotent operation that releases the matching root claim. */
    readonly #releaseClaim: () => void;
    /** @description Current irreversible lifecycle state. */
    #state: TRendererSessionState = "open";
    /** @description Validated capabilities available only while the session is ready. */
    #capabilities: RendererCapabilityRegistry<Parent, Value> | undefined;

    /**
     * @description Creates one open wrapper around a validated host session.
     * @param host - Exclusive host session returned by the configured adapter.
     * @param releaseClaim - Idempotent operation releasing the Renderer root claim.
     */
    constructor(host: RendererHostSession<Parent, Value>, releaseClaim: () => void) {
        this.#host = host;
        this.#releaseClaim = releaseClaim;
    }

    /**
     * @description Whether this wrapper has entered its permanent terminal state.
     * @returns Whether the host session has been closed.
     */
    get closed(): boolean {
        return this.#state === "closed";
    }

    /**
     * @description Returns the host session after successful preflight and before closure.
     * @returns The live exclusive host session.
     */
    get host(): RendererHostSession<Parent, Value> {
        this.#assertReady();
        return this.#host;
    }

    /**
     * @description Returns the validated capability lookup after successful preflight.
     * @returns The immutable session capability registry.
     */
    get capabilities(): RendererCapabilityRegistry<Parent, Value> {
        this.#assertReady();
        return this.#capabilities as RendererCapabilityRegistry<Parent, Value>;
    }

    /**
     * @description Preflights one standalone Template definition exactly once.
     * @typeParam State - Read-only state accepted by the Template occurrence.
     * @param definition - Normalized immutable Template program.
     * @returns Nothing after all reachable capabilities are accepted.
     */
    preflightTemplate<State extends object>(definition: TemplateDefinition<State>): void {
        const collector = new RendererRequirementCollector();
        this.#preflight(collector.collectTemplate(definition));
    }

    /**
     * @description Preflights one templated Component definition exactly once.
     * @typeParam Inputs - Declarative component input value shape.
     * @typeParam Controller - Public component controller object.
     * @param definition - Immutable compatible Component and Template composition.
     * @returns Nothing after all reachable capabilities are accepted.
     */
    preflightComponent<Inputs extends object, Controller extends object>(
        definition: TemplatedComponentDefinition<Inputs, Controller>,
    ): void {
        const collector = new RendererRequirementCollector();
        this.#preflight(collector.collectComponent(definition));
    }

    /**
     * @description Idempotently terminalizes the wrapper, closes the host, and releases its claim.
     * @returns Nothing when host closure succeeds or the wrapper was already closed.
     */
    close(): void {
        if (this.#state === "closed") {
            return;
        }

        this.#state = "closed";
        this.#capabilities = undefined;

        try {
            const result: unknown = this.#host.close();

            if (result !== undefined) {
                throw new RendererProtocolError("close", result);
            }
        } finally {
            this.#releaseClaim();
        }
    }

    /**
     * @description Runs one capability preflight and closes the session after any failure.
     * @param requirements - Ordered unique reachable capability requirements.
     * @returns Nothing after transitioning to ready state.
     */
    #preflight(
        requirements: Parameters<RendererCapabilityPreflight<Parent, Value>["run"]>[0],
    ): void {
        if (this.#state !== "open") {
            throw new TypeError("A Renderer session can be preflighted exactly once while open.");
        }

        try {
            this.#capabilities = new RendererCapabilityPreflight(this.#host).run(requirements);
            this.#state = "ready";
        } catch (error) {
            try {
                this.close();
            } catch (closeError) {
                throw new AggregateError(
                    [error, closeError],
                    "Renderer preflight and host-session cleanup failed.",
                );
            }

            throw error;
        }
    }

    /**
     * @description Rejects access unless preflight completed and the session remains live.
     * @returns Nothing when the session is ready.
     */
    #assertReady(): void {
        if (this.#state !== "ready") {
            throw new TypeError("The Renderer session is not ready for host execution.");
        }
    }
}
