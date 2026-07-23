import type { ComponentOccurrence } from "@lilium/component/integration";
import type { RenderBinding } from "@lilium/core/integration";
import { RendererCleanupCollector } from "../../shared/runtime/renderer-cleanup.collector.js";
import type { IRendererPlaceableOccurrence } from "../contracts/internal/renderer-placeable-occurrence.contract.js";
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
> implements IRendererPlaceableOccurrence<Parent, Value>
{
    /** @description Exact application state retained by the Template occurrence. */
    readonly #state: State;
    /** @description Ordered root fragment created for this Template occurrence. */
    readonly #roots: RendererFragmentOccurrence<Parent, Value>;
    /** @description Primitive occurrences keyed by normalized definition-local reference. */
    readonly #primitives: ReadonlyMap<number, RendererPrimitiveOccurrence<Parent, Value>>;
    /** @description Nested Component occurrences keyed by normalized declaration reference. */
    readonly #components: ReadonlyMap<number, ComponentOccurrence<object, object>>;
    /** @description Reactive bindings created directly by this Template definition occurrence. */
    readonly #bindings: readonly RenderBinding[];
    /** @description Whether this Template occurrence has entered terminal cleanup. */
    #disposed = false;

    /**
     * @description Creates one private Template execution identity.
     * @param state - Exact read-only application state retained by reference.
     * @param roots - Ordered host-producing root fragment.
     * @param primitives - Complete primitive occurrence lookup by normalized reference.
     * @param components - Nested Component occurrence lookup by normalized reference.
     * @param bindings - Reactive bindings directly owned by this Template occurrence.
     */
    constructor(
        state: State,
        roots: RendererFragmentOccurrence<Parent, Value>,
        primitives: ReadonlyMap<number, RendererPrimitiveOccurrence<Parent, Value>>,
        components: ReadonlyMap<number, ComponentOccurrence<object, object>>,
        bindings: readonly RenderBinding[],
    ) {
        this.#state = state;
        this.#roots = roots;
        this.#primitives = new Map(primitives);
        this.#components = new Map(components);
        this.#bindings = Object.freeze([...bindings]);
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
     * @description Returns the number of host roots produced by this Template occurrence.
     * @returns Ordered root count.
     */
    get size(): number {
        return this.#roots.size;
    }

    /**
     * @description Returns the number of reactive bindings owned directly by this occurrence.
     * @returns Direct binding count excluding nested Template occurrences.
     */
    get bindingCount(): number {
        return this.#bindings.length;
    }

    /**
     * @description Returns whether this complete Template occurrence is terminal.
     * @returns Whether binding and nested occurrence cleanup has begun.
     */
    get disposed(): boolean {
        return this.#disposed;
    }

    /**
     * @description Cancels bindings and releases nested occurrences in reverse ownership order.
     * @returns Nothing after all cleanup is attempted, or throws collected failures.
     */
    dispose(): void {
        if (this.#disposed) {
            return;
        }

        this.#disposed = true;
        const cleanup = new RendererCleanupCollector();

        for (let index = this.#bindings.length - 1; index >= 0; index -= 1) {
            cleanup.attempt(() => this.#bindings[index]?.dispose());
        }

        const components = [...this.#components.values()];
        for (let index = components.length - 1; index >= 0; index -= 1) {
            cleanup.attempt(() => components[index]?.dispose());
        }

        const primitives = [...this.#primitives.values()];
        for (let index = primitives.length - 1; index >= 0; index -= 1) {
            cleanup.attempt(() => primitives[index]?.detach());
        }

        for (let index = primitives.length - 1; index >= 0; index -= 1) {
            cleanup.attempt(() => primitives[index]?.release());
        }

        cleanup.throwIfAny("Renderer Template occurrence cleanup failed.");
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
     * @description Resolves one nested Component occurrence by normalized declaration reference.
     * @typeParam Inputs - Declarative input shape of the requested nested Component.
     * @typeParam Controller - Public controller shape of the requested nested Component.
     * @param reference - Nested Component reference assigned during Template normalization.
     * @returns Exact protected Component integration occurrence.
     */
    component<Inputs extends object = object, Controller extends object = object>(
        reference: number,
    ): ComponentOccurrence<Inputs, Controller> {
        const occurrence = this.#components.get(reference);

        if (occurrence === undefined) {
            throw new TypeError("The Template reference does not identify a Component occurrence.");
        }

        return occurrence as ComponentOccurrence<Inputs, Controller>;
    }

    /**
     * @description Places or moves every Template root in deterministic declaration order.
     * @param parent - Destination parent receiving all Template roots.
     * @param before - Shared sibling anchor, or null for the ordered end.
     * @returns Nothing after every ordered root placement succeeds.
     */
    place(parent: Parent, before: Value | null): void {
        if (this.#disposed) {
            throw new Error("Cannot place a disposed Renderer Template occurrence.");
        }

        this.#roots.place(parent, before);
    }
}
