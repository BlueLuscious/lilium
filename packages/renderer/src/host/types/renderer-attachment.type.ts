/**
 * @description Renderer-owned record of one opaque value's current host parent.
 * @typeParam Parent - Opaque host parent handle type.
 */
export type RendererAttachmentType<Parent extends object> = Readonly<{
    /** @description Current immediate opaque parent handle. */
    parent: Parent;
}>;
