import type { ComponentDefinition } from "../../component/contracts/component-definition.contract.js";
import type { ComponentCreateOptionsType } from "../../runtime/types/component-create-options.type.js";
import type { ComponentOccurrence } from "./component-occurrence.contract.js";

/**
 * @description Runtime-bound capability for creating renderer-owned component occurrences.
 * @remarks Creation reuses atomic headless setup, then creates one dedicated attachment scope
 * beneath the private component scope without exposing either mutable implementation.
 */
export interface ComponentOccurrenceRuntime {
    /**
     * @description Creates and initializes one component occurrence under an explicit owner.
     * @remarks A handled setup failure returns `undefined`; a propagated failure throws after
     * incomplete component ownership is released. No attachment exists unless setup succeeds.
     * @typeParam Inputs - Declarative input value shape of the component.
     * @typeParam Controller - Public object shape returned by component setup.
     * @param definition - Immutable reusable headless component definition.
     * @param options - Complete initial inputs and owning Core scope.
     * @returns The adapter occurrence, or `undefined` when setup failure was handled.
     */
    create<Inputs extends object, Controller extends object>(
        definition: ComponentDefinition<Inputs, Controller>,
        options: ComponentCreateOptionsType<Inputs>,
    ): ComponentOccurrence<Inputs, Controller> | undefined;
}
