import type { RenderContext } from "../../context/contracts/render-context.contract";
import type { ContextProviderListType } from "../../context/types/context-provider-list.type";
import type { AbstractViewNode } from "../../render/contracts/abstract-view-node.contract";
import type { Action } from "../../shared/contracts/action.contract";
import type { IComponentDefinition } from "./internal/component-definition.contract";


/**
 * @description Public strongly-typed component contract for framework consumers.
 * @remarks Use this interface for user-authored component definitions.
 * @typeParam State - Component state type.
 * @typeParam Inputs - Component input/props type.
 */
export interface ComponentDefinition<State = unknown, Inputs = unknown> extends IComponentDefinition {
    /**
     * @description Creates the initial state from typed inputs.
     * @param inputs - Typed component inputs.
     * @returns Initial typed component state.
     */
    initState(inputs: Inputs): State;

    /**
     * @description Produces the next typed state from the previous state and a dispatched action.
     * @param state - Current typed component state.
     * @param action - Dispatched action.
     * @returns Next typed component state.
     */
    update(state: State, action: Action): State;

    /**
     * @description Produces the abstract view node for typed state and inputs.
     * @param state - Current typed component state.
     * @param inputs - Current typed component inputs.
     * @param context - Render-time context accessor.
     * @returns Abstract node consumed by the render engine.
     */
    render(state: State, inputs: Inputs, context: RenderContext): AbstractViewNode;

    /**
     * @description Optional typed context providers produced by this component.
     * @param inputs - Typed component inputs.
     * @returns Read-only context key/value pairs to inject in the component render scope.
     */
    provideContext?(inputs: Inputs): ContextProviderListType;
}
