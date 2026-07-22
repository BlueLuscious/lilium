import type { RendererFragmentOccurrence } from "./renderer-fragment.occurrence.js";
import type { RendererPrimitiveOccurrence } from "./renderer-primitive.occurrence.js";

/**
 * @description Owns one instantiated Template state, ordered roots, and reference lookup.
 * @typeParam State - Read-only state associated with this Template occurrence.
 * @typeParam Parent - Host value shape that can contain rendered values.
 * @typeParam Value - Concrete opaque host value shape owned by primitive occurrences.
 */
export class RendererTemplateOccurrence<
    State extends object,
    Parent extends object,
    Value extends Parent,
> {
    /** @description Exact application state retained by the Template occurrence. */
    readonly #state: State;
    /** @description Ordered root fragment created for this Template occurrence. */
    readonly #roots: RendererFragmentOccurrence<Parent, Value>;
    /** @description Primitive occurrences keyed by normalized definition-local reference. */
    readonly #primitives: ReadonlyMap<number, RendererPrimitiveOccurrence<Parent, Value>>;

    /**
     * @description Creates one private Template execution identity.
     * @param state - Exact read-only application state retained by reference.
     * @param roots - Ordered host-producing root fragment.
     * @param primitives - Complete primitive occurrence lookup by normalized reference.
     */
    constructor(
        state: State,
        roots: RendererFragmentOccurrence<Parent, Value>,
        primitives: ReadonlyMap<number, RendererPrimitiveOccurrence<Parent, Value>>,
    ) {
        this.#state = state;
        this.#roots = roots;
        this.#primitives = new Map(primitives);
    }

    /**
     * @description Returns the exact state object retained for future dynamic bindings.
     * @returns Template occurrence state.
     */
    get state(): State {
        return this.#state;
    }

    /**
     * @description Returns the number of host-producing Template roots.
     * @returns Ordered root count.
     */
    get rootCount(): number {
        return this.#roots.size;
    }

    /**
     * @description Resolves one primitive occurrence by normalized definition-local reference.
     * @param reference - Primitive node reference assigned during Template normalization.
     * @returns The exact occurrence and its privately owned host handle.
     */
    primitive(reference: number): RendererPrimitiveOccurrence<Parent, Value> {
        const occurrence = this.#primitives.get(reference);

        if (occurrence === undefined) {
            throw new TypeError("The Template reference does not identify a primitive occurrence.");
        }

        return occurrence;
    }

    /**
     * @description Places or moves every Template root in deterministic declaration order.
     * @param parent - Destination parent receiving all Template roots.
     * @param before - Shared sibling anchor, or null for the ordered end.
     * @returns Nothing after every ordered root placement succeeds.
     */
    place(parent: Parent, before: Value | null): void {
        this.#roots.place(parent, before);
    }
}
