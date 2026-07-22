import type { RendererPrimitiveOccurrence } from "./renderer-primitive.occurrence.js";

/**
 * @description Owns one ordered collection of primitive roots without a synthetic host wrapper.
 * @typeParam Parent - Host value shape that can contain rendered values.
 * @typeParam Value - Concrete opaque host value shape owned by primitive occurrences.
 */
export class RendererFragmentOccurrence<Parent extends object, Value extends Parent> {
    /** @description Ordered primitive roots produced by this fragment. */
    readonly #roots: readonly RendererPrimitiveOccurrence<Parent, Value>[];

    /**
     * @description Creates one immutable ordered fragment occurrence.
     * @param roots - Primitive roots in declaration order.
     */
    constructor(roots: readonly RendererPrimitiveOccurrence<Parent, Value>[]) {
        this.#roots = Object.freeze([...roots]);
    }

    /**
     * @description Returns the number of host-producing roots in this fragment.
     * @returns Ordered primitive root count.
     */
    get size(): number {
        return this.#roots.length;
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
