import type { ComponentOccurrence } from "@lilium/component/integration";
import type { RenderBinding } from "@lilium/core/integration";
import { RendererCleanupCollector } from "../../shared/runtime/renderer-cleanup.collector.js";
import type { IRendererPlaceableOccurrence } from "../contracts/internal/renderer-placeable-occurrence.contract.js";
import type { RendererTemplateOccurrence } from "./renderer-template.occurrence.js";

/**
 * @description Connects one protected headless Component occurrence to its visual Template roots.
 * @typeParam Parent - Host value shape that can contain rendered values.
 * @typeParam Value - Concrete opaque host value shape produced by the visual Template.
 * @typeParam Inputs - Declarative input shape of the headless Component occurrence.
 * @typeParam Controller - Public controller shape of the headless Component occurrence.
 */
export class RendererComponentOccurrence<
    Parent extends object,
    Value extends Parent,
    Inputs extends object = object,
    Controller extends object = object,
> implements IRendererPlaceableOccurrence<Parent, Value>
{
    /** @description Protected Component bridge occurrence owning setup and attachment scopes. */
    readonly #component: ComponentOccurrence<Inputs, Controller>;
    /** @description Visual Template occurrence owned beneath the Component attachment. */
    readonly #template: RendererTemplateOccurrence<object, Parent, Value>;
    /** @description Parent-owned input bindings that must stop with this nested Component. */
    readonly #inputBindings: readonly RenderBinding[];
    /** @description Whether this composed occurrence has entered terminal cleanup. */
    #disposed = false;

    /**
     * @description Creates one nested rendered Component composition.
     * @param component - Initialized protected headless Component occurrence.
     * @param template - Instantiated visual Template under the Component attachment.
     * @param inputBindings - Parent bindings dedicated exclusively to this Component occurrence.
     */
    constructor(
        component: ComponentOccurrence<Inputs, Controller>,
        template: RendererTemplateOccurrence<object, Parent, Value>,
        inputBindings: readonly RenderBinding[] = [],
    ) {
        this.#component = component;
        this.#template = template;
        this.#inputBindings = Object.freeze([...inputBindings]);
    }

    /**
     * @description Returns the number of visual host roots produced by this Component.
     * @returns Nested visual Template root count.
     */
    get size(): number {
        return this.#template.size;
    }

    /**
     * @description Returns whether visual and headless cleanup has begun.
     * @returns Whether this rendered Component occurrence is terminal.
     */
    get disposed(): boolean {
        return this.#disposed;
    }

    /**
     * @description Returns the protected Component occurrence for updates and later disposal.
     * @returns Component integration occurrence connected to this visual composition.
     */
    get component(): ComponentOccurrence<Inputs, Controller> {
        return this.#component;
    }

    /**
     * @description Releases visual resources before the complete headless Component occurrence.
     * @returns Nothing after both cleanup stages are attempted, or throws collected failures.
     */
    dispose(): void {
        if (this.#disposed) {
            return;
        }

        this.#disposed = true;
        const cleanup = new RendererCleanupCollector();

        for (let index = this.#inputBindings.length - 1; index >= 0; index -= 1) {
            cleanup.attempt(() => this.#inputBindings[index]?.dispose());
        }

        cleanup.attempt(() => this.#template.dispose());
        cleanup.attempt(() => this.#component.dispose());
        cleanup.throwIfAny("Rendered Component occurrence cleanup failed.");
    }

    /**
     * @description Places or moves every visual root in declaration order.
     * @param parent - Destination parent receiving the visual roots.
     * @param before - Shared sibling anchor, or null for the ordered end.
     * @returns Nothing after nested Template placement succeeds.
     */
    place(parent: Parent, before: Value | null): void {
        if (this.#disposed) {
            throw new Error("Cannot place a disposed Renderer Component occurrence.");
        }

        this.#template.place(parent, before);
    }
}
