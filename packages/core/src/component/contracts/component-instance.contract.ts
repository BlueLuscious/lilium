import type { ComponentDefinition } from "./component-definition.contract";
import type { AbstractViewNode } from "../../render/contracts/abstract-view-node.contract";


/**
 * @description Public read-only representation of a mounted component.
 * @remarks This shape is safe to expose to consumers because it hides internal
 * runtime wiring details such as context scope mutation.
 * @typeParam State - Concrete state type for this instance.
 * @typeParam Inputs - Concrete input/props type for this instance.
 */
export interface ComponentInstance<State = unknown, Inputs = unknown> {
    /** @description Stable instance identity (definition id or keyed derived identity). */
    readonly id: string;

    /** @description Static component behavior associated with this instance. */
    readonly definition: ComponentDefinition;

    /** @description Current inputs/props assigned to this instance. */
    readonly inputs: Inputs;

    /** @description Current state snapshot for the instance. */
    readonly state: State;

    /** @description Indicates whether the instance has pending changes to be rendered. */
    readonly dirty: boolean;

    /** @description Direct child component instances in the runtime tree. */
    readonly children: ReadonlyArray<ComponentInstance<unknown, unknown>>;

    /** @description Last rendered abstract node output for this instance. */
    readonly view: AbstractViewNode | null;

    /** @description True once mount lifecycle has been executed for this instance. */
    readonly mounted: boolean;
}
