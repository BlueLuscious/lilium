import type { IRendererPlaceableOccurrence } from "../contracts/internal/renderer-placeable-occurrence.contract.js";

/**
 * @description Owns one ordered collection of primitive roots without a synthetic host wrapper.
 * @typeParam Parent - Host value shape that can contain rendered values.
 * @typeParam Value - Concrete opaque host value shape owned by primitive occurrences.
 */
export class RendererFragmentOccurrence<Parent extends object, Value extends Parent> {
    /** @description Ordered primitive roots produced by this fragment. */
    readonly #roots: readonly IRendererPlaceableOccurrence<Parent, Value>[];

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
     * @description Places every root in declaration order before one shared sibling anchor.
     * @param parent - Destination parent receiving all fragment roots.
     * @param before - Shared sibling anchor, or null for the ordered end.
     * @returns Nothing after every ordered placement succeeds.
     */
    place(parent: Parent, before: Value | null): void {
        for (const root of this.#roots) {
            root.place(parent, before);
        }
    }
}
