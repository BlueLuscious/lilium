import type { ReactiveRuntime, Scope } from "@lilium/core";
import type { IRendererPlaceableOccurrence } from "../../execution/contracts/internal/renderer-placeable-occurrence.contract.js";
import type { RendererSession } from "../../session/runtime/renderer-session.js";
import { RendererCleanupCollector } from "../../shared/runtime/renderer-cleanup.collector.js";

/**
 * @description Coordinates one mounted application's terminal state and ownership ordering.
 * @typeParam Parent - Opaque host handle shape that may contain rendered values.
 * @typeParam Value - Opaque host value shape released by the application.
 */
export class RendererApplicationLifecycle<Parent extends object, Value extends Parent> {
    /** @description Core runtime providing the outer disposal batch boundary. */
    readonly #runtime: ReactiveRuntime;
    /** @description Application scope whose ledger closes resources before the host session. */
    readonly #scope: Scope;
    /** @description Whether this application has entered irreversible terminal cleanup. */
    #disposed = false;
    /** @description Whether one complete root occurrence has been attached to this lifecycle. */
    #attached = false;
    /** @description Complete root occurrence retained for explicit ordered unmount. */
    #root: IRendererPlaceableOccurrence<Parent, Value> | undefined;

    /** @description Child scope that owns every rendered application resource. */
    readonly resources: Scope;

    /**
     * @description Creates the ordered application ledger after one host session opens.
     * @remarks Session closure is registered first, the resource scope second, and the terminal
     * marker last so Core's LIFO disposal observes terminal state before releasing resources.
     * @param runtime - Externally owned Core runtime coordinating disposal batching.
     * @param scope - Dedicated application scope created beneath the optional mount owner.
     * @param session - Open exclusive host session owned by this application.
     */
    constructor(runtime: ReactiveRuntime, scope: Scope, session: RendererSession<Parent, Value>) {
        this.#runtime = runtime;
        this.#scope = scope;
        scope.cleanup(() => {
            session.close();
            return undefined;
        });
        this.resources = scope.child();
        scope.cleanup(() => {
            this.#disposed = true;
            return undefined;
        });
        Object.freeze(this);
    }

    /**
     * @description Reports whether application terminalization has begun.
     * @returns Whether updates and new root attachment are permanently rejected.
     */
    get disposed(): boolean {
        return this.#disposed;
    }

    /**
     * @description Registers the unique complete root occurrence as the last resource cleanup.
     * @param occurrence - Successfully constructed and placed root occurrence.
     * @returns Nothing after root cleanup ownership is retained.
     */
    attach(occurrence: IRendererPlaceableOccurrence<Parent, Value>): void {
        this.assertOpen("attach a Renderer root occurrence");

        if (this.#attached) {
            throw new Error("A rendered application already owns its root occurrence.");
        }

        this.#attached = true;
        this.#root = occurrence;
    }

    /**
     * @description Idempotently terminalizes the complete application inside one Core batch.
     * @remarks Terminal state commits before disposal so reentrant host cleanup is harmless.
     * @returns Nothing after resources and the host session complete cleanup.
     */
    dispose(): void {
        if (this.#disposed) {
            return;
        }

        this.#disposed = true;
        this.#runtime.batch(() => {
            const cleanup = new RendererCleanupCollector();
            cleanup.attempt(() => this.#root?.dispose());
            this.#root = undefined;
            cleanup.attempt(() => this.#scope.dispose());
            cleanup.throwIfAny("Rendered application cleanup failed.");
            return undefined;
        });
    }

    /**
     * @description Rejects operations after application terminalization begins.
     * @param operation - Human-readable operation used by the lifecycle error.
     * @returns Nothing while the application remains live.
     */
    assertOpen(operation: string): void {
        if (this.#disposed) {
            throw new Error(`Cannot ${operation} on a disposed rendered application.`);
        }
    }
}
