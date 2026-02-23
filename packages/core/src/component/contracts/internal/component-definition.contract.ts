import type { RenderContext } from "../../../context/contracts/render-context.contract";
import type { ContextProviderListType } from "../../../context/types/context-provider-list.type";
import type { Lifecycle } from "../../../lifecycle/contracts/lifecycle.contract";
import type { AbstractViewNode } from "../../../render/contracts/abstract-view-node.contract";
import type { Action } from "../../../shared/contracts/action.contract";


/**
 * @description Internal type-erased component contract used by Core runtime services.
 * @remarks This interface intentionally uses `unknown` so runtime services
 * (registry, renderer, instance manager) can operate on component definitions
 * without carrying state/input generics at call sites.
 * @remarks This is an internal contract and is not intended as stable public API.
 */
export interface IComponentDefinition {
    /** @description Stable component identifier used by the registry and component nodes. */
    readonly id: string;

    /**
     * @description Creates the initial state from runtime inputs.
     * @param inputs - Runtime inputs passed to the component.
     * @returns Initial component state.
     */
    initState(inputs: unknown): unknown;

    /**
     * @description Produces the next state for a dispatched action.
     * @param state - Current component state.
     * @param action - Dispatched action.
     * @returns Next component state.
     */
    update(state: unknown, action: Action): unknown;

    /**
     * @description Produces the abstract view node for the current state and inputs.
     * @param state - Current component state.
     * @param inputs - Current component inputs.
     * @param context - Render-time context accessor.
     * @returns Abstract node consumed by the render engine.
     */
    render(state: unknown, inputs: unknown, context: RenderContext): AbstractViewNode;

    /** @description Optional mount and unmount hooks for this component. */
    lifecycle?: Lifecycle;

    /**
     * @description Optional context providers produced by this component.
     * Values are scoped to the component render subtree.
     * @param inputs - Runtime inputs available for provider construction.
     * @returns Read-only context key/value pairs to inject in the component render scope.
     */
    provideContext?(inputs: unknown): ContextProviderListType;
}
