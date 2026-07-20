/**
 * @description Destination position for one opaque value in an ordered host child sequence.
 * @typeParam Parent - Opaque host parent handle type.
 * @typeParam Value - Opaque host value handle type.
 */
export type RendererPlacementType<Parent extends object, Value extends Parent> = Readonly<{
    /** @description Destination immediate parent handle. */
    parent: Parent;

    /** @description Immediate sibling anchor, or `null` for the end of the child sequence. */
    before: Value | null;
}>;
