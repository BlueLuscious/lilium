/**
 * @description Public action contract dispatched to component update functions.
 * @remarks An action describes what happened ({@link Action.type `Type`}) and may carry optional
 * business data ({@link Action.payload `Payload`}) plus optional routing metadata ({@link Action.target `Target`}).
 * @typeParam Type - Literal or semantic action identifier.
 * @typeParam Payload - Optional payload type carried by the action.
 * @typeParam Target - Optional routing metadata type.
 */
export interface Action<
    Type extends string = string,
    Payload = unknown,
    Target = unknown
> {
    /** @description Semantic action identifier consumed by update logic. */
    readonly type: Type;

    /** @description Optional arbitrary data associated with this action. */
    readonly payload?: Payload;

    /** @description Optional target metadata for routing and scoping strategies. */
    readonly target?: Target;
}
