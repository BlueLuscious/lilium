/**
 * @description Private structural capability for an occurrence producing ordered host roots.
 * @typeParam Parent - Host value shape that can contain rendered values.
 * @typeParam Value - Concrete opaque host value shape placed by the occurrence.
 */
export interface IRendererPlaceableOccurrence<Parent extends object, Value extends Parent> {
    /** @description Whether this occurrence has entered its irreversible terminal state. */
    readonly disposed: boolean;

    /** @description Number of immediate host roots produced by this occurrence. */
    readonly size: number;

    /**
     * @description Idempotently releases every resource owned by this occurrence.
     * @returns Nothing after all terminal cleanup has been attempted.
     */
    dispose(): void;

    /**
     * @description Places or moves every produced root before one shared sibling anchor.
     * @param parent - Destination immediate parent handle.
     * @param before - Shared sibling anchor, or null for the ordered end.
     * @returns Nothing after every ordered placement succeeds.
     */
    place(parent: Parent, before: Value | null): void;
}
