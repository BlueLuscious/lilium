import { RendererCleanupCollector } from "../../shared/runtime/renderer-cleanup.collector.js";
import type { IRendererPlaceableOccurrence } from "../contracts/internal/renderer-placeable-occurrence.contract.js";

/**
 * @description Owns one ordered collection of primitive roots without a synthetic host wrapper.
 * @typeParam Parent - Host value shape that can contain rendered values.
 * @typeParam Value - Concrete opaque host value shape owned by primitive occurrences.
 */
export class RendererFragmentOccurrence<Parent extends object, Value extends Parent>
    implements IRendererPlaceableOccurrence<Parent, Value>
{
    /** @description Ordered primitive roots produced by this fragment. */
    readonly #roots: readonly IRendererPlaceableOccurrence<Parent, Value>[];
    /** @description Whether this fragment has entered irreversible terminal cleanup. */
    #disposed = false;

    /**
     * @description Creates one immutable ordered fragment occurrence.
     * @param roots - Primitive roots in declaration order.
     */
    constructor(roots: readonly IRendererPlaceableOccurrence<Parent, Value>[]) {
        this.#roots = Object.freeze([...roots]);
    }

    /**
     * @description Returns the number of host-producing roots in this fragment.
     * @returns Ordered primitive root count.
     */
    get size(): number {
        let size = 0;

        for (const root of this.#roots) {
            size += root.size;
        }

        return size;
    }

    /**
     * @description Returns whether this fragment has become terminal.
     * @returns Whether reverse root cleanup has already begun.
     */
    get disposed(): boolean {
        return this.#disposed;
    }

    /**
     * @description Disposes every root in reverse declaration order exactly once.
     * @returns Nothing after all root cleanup is attempted, or throws collected failures.
     */
    dispose(): void {
        if (this.#disposed) {
            return;
        }

        this.#disposed = true;
        const cleanup = new RendererCleanupCollector();

        for (let index = this.#roots.length - 1; index >= 0; index -= 1) {
            cleanup.attempt(() => this.#roots[index]?.dispose());
        }

        cleanup.throwIfAny("Renderer fragment cleanup failed.");
    }

    /**
     * @description Places every root in declaration order before one shared sibling anchor.
     * @param parent - Destination parent receiving all fragment roots.
     * @param before - Shared sibling anchor, or null for the ordered end.
     * @returns Nothing after every ordered placement succeeds.
     */
    place(parent: Parent, before: Value | null): void {
        if (this.#disposed) {
            throw new Error("Cannot place a disposed Renderer fragment occurrence.");
        }

        for (const root of this.#roots) {
            root.place(parent, before);
        }
    }
}
