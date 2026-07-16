import type { ReactiveRuntime } from "@lilium/core";
import { CoreIntegration } from "@lilium/core/integration";
import type { ComponentDefinition } from "../../component/contracts/component-definition.contract.js";
import type { IComponentInstanceLifecycle } from "../../instance/contracts/internal/component-instance-lifecycle.contract.js";
import { componentEngine } from "../../runtime/component.engine.js";
import type { IComponentEngine } from "../../runtime/contracts/internal/component-engine.contract.js";
import type { ComponentCreateOptionsType } from "../../runtime/types/component-create-options.type.js";
import type { ComponentOccurrence as ComponentOccurrenceContract } from "../contracts/component-occurrence.contract.js";
import type { ComponentOccurrenceRuntime as ComponentOccurrenceRuntimeContract } from "../contracts/component-occurrence-runtime.contract.js";
import { ComponentOccurrence } from "./component-occurrence.js";

/**
 * @description Internal frozen implementation of one runtime-bound occurrence capability.
 * @remarks It reuses atomic component setup and erases the returned mutable lifecycle behind a
 * protected occurrence before any adapter-facing object escapes.
 */
export class ComponentOccurrenceRuntime implements ComponentOccurrenceRuntimeContract {
    /** @description Internal creation engine shared with the root Component runtime. */
    readonly #engine: IComponentEngine;

    /** @description Genuine externally owned Core runtime used by component occurrences. */
    readonly #runtime: ReactiveRuntime;

    /**
     * @description Creates an occurrence runtime bound to one genuine live Core runtime.
     * @param runtime - Public Core runtime candidate supplied through integration.
     * @returns A frozen narrow component occurrence runtime.
     */
    static create(runtime: ReactiveRuntime): ComponentOccurrenceRuntimeContract {
        CoreIntegration.assertRuntime(runtime);
        return new ComponentOccurrenceRuntime(runtime, componentEngine);
    }

    /**
     * @description Constructs one frozen occurrence runtime with explicit internal dependencies.
     * @param runtime - Genuine externally owned Core runtime.
     * @param engine - Internal engine responsible for atomic component setup.
     */
    private constructor(runtime: ReactiveRuntime, engine: IComponentEngine) {
        this.#runtime = runtime;
        this.#engine = engine;
        Object.freeze(this);
    }

    /**
     * @description Creates one initialized protected component occurrence.
     * @typeParam Inputs - Declarative input value shape of the component.
     * @typeParam Controller - Public object shape returned by component setup.
     * @param definition - Immutable reusable headless component definition.
     * @param options - Complete initial inputs and explicit owner scope.
     * @returns The occurrence, or `undefined` after a handled setup failure.
     */
    create<Inputs extends object, Controller extends object>(
        definition: ComponentDefinition<Inputs, Controller>,
        options: ComponentCreateOptionsType<Inputs>,
    ): ComponentOccurrenceContract<Inputs, Controller> | undefined {
        const lifecycle = this.#engine.create(this.#runtime, definition, options);

        if (lifecycle === undefined) {
            return undefined;
        }

        try {
            return ComponentOccurrence.create(lifecycle);
        } catch (error) {
            return this.#rethrowAfterDisposal(lifecycle, error);
        }
    }

    /**
     * @description Disposes an initialized lifecycle that failed occurrence materialization.
     * @typeParam Inputs - Declarative input value shape of the component.
     * @typeParam Controller - Public object shape returned by component setup.
     * @param lifecycle - Initialized lifecycle that must not escape partial creation.
     * @param creationError - Original occurrence materialization failure.
     * @returns This operation never returns because one preserved failure is thrown.
     */
    #rethrowAfterDisposal<Inputs extends object, Controller extends object>(
        lifecycle: IComponentInstanceLifecycle<Inputs, Controller>,
        creationError: unknown,
    ): never {
        try {
            lifecycle.dispose();
        } catch (disposalError) {
            throw new AggregateError(
                [creationError, disposalError],
                "Component occurrence creation and lifecycle disposal both failed.",
            );
        }

        throw creationError;
    }
}
