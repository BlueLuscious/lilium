import type { IComponentDefinition } from "./component-definition.contract";
import type { IContextScope } from "../../../context/contracts/internal/context-scope.contract";
import type { AbstractViewNode } from "../../../render/contracts/abstract-view-node.contract";


/**
 * @description Internal mutable runtime representation of a mounted component.
 * @remarks Core services mutate this structure during dispatch, render, and lifecycle.
 * This type is intentionally internal and should not be treated as stable API.
 * @typeParam State - Concrete state type for this instance.
 * @typeParam Inputs - Concrete input/props type for this instance.
 */
export interface IComponentInstance<State = unknown, Inputs = unknown> {
    /** @description Stable instance identity (definition id or keyed derived identity). */
    id: string;

    /** @description Static component behavior used by this instance (init, update, render, hooks). */
    definition: IComponentDefinition;

    /** @description Current inputs/props assigned to this instance. */
    inputs: Inputs;

    /** @description Current mutable state of the instance. */
    state: State;

    /** @description Indicates whether the instance has pending changes to be rendered. */
    dirty: boolean;

    /** @description Direct child component instances in the runtime tree. */
    children: IComponentInstance<unknown, unknown>[];

    /** @description Last rendered abstract node output for this instance. */
    view: AbstractViewNode | null;

    /** @description True once mount lifecycle has been executed for this instance. */
    mounted: boolean;

    /** @description Mutable context scope used as inheritance base during render. */
    context: IContextScope;
}
