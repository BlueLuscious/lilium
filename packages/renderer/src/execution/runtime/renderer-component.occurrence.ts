import type { ComponentOccurrence } from "@lilium/component/integration";
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

    /**
     * @description Creates one nested rendered Component composition.
     * @param component - Initialized protected headless Component occurrence.
     * @param template - Instantiated visual Template under the Component attachment.
     */
    constructor(
        component: ComponentOccurrence<Inputs, Controller>,
        template: RendererTemplateOccurrence<object, Parent, Value>,
    ) {
        this.#component = component;
        this.#template = template;
    }

    /**
     * @description Returns the number of visual host roots produced by this Component.
     * @returns Nested visual Template root count.
     */
    get size(): number {
        return this.#template.size;
    }

    /**
     * @description Returns the protected Component occurrence for updates and later disposal.
     * @returns Component integration occurrence connected to this visual composition.
     */
    get component(): ComponentOccurrence<Inputs, Controller> {
        return this.#component;
    }

    /**
     * @description Places or moves every visual root in declaration order.
     * @param parent - Destination parent receiving the visual roots.
     * @param before - Shared sibling anchor, or null for the ordered end.
     * @returns Nothing after nested Template placement succeeds.
     */
    place(parent: Parent, before: Value | null): void {
        this.#template.place(parent, before);
    }
}
