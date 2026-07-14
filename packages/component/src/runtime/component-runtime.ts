import type { ReactiveRuntime } from "@lilium/core";
import type { ComponentDefinition } from "../component/contracts/component-definition.contract.js";
import type { ComponentInstance as ComponentInstanceContract } from "../instance/contracts/component-instance.contract.js";
import { ComponentInstance } from "../instance/runtime/component-instance.js";
import { componentEngine } from "./component.engine.js";
import type { ComponentRuntime as ComponentRuntimeContract } from "./contracts/component-runtime.contract.js";
import type { IComponentEngine } from "./contracts/internal/component-engine.contract.js";
import type { ComponentCreateOptionsType } from "./types/component-create-options.type.js";

/**
 * @description Component runtime object bound to one externally owned reactive runtime.
 * @remarks Construction allocates no scope and takes no ownership of the reactive runtime.
 * Each successful creation is wrapped so internal lifecycle capabilities cannot escape.
 */
export class ComponentRuntime implements ComponentRuntimeContract {
    /** @description Internal creation engine used by this component runtime. */
    readonly #engine: IComponentEngine;

    /** @description Externally owned reactive runtime used for every component creation. */
    readonly #runtime: ReactiveRuntime;

    /**
     * @description Creates one frozen component runtime with explicit internal dependencies.
     * @param runtime - Externally owned reactive runtime used by component instances.
     * @param engine - Internal engine responsible for atomic owned component creation.
     */
    private constructor(runtime: ReactiveRuntime, engine: IComponentEngine) {
        this.#runtime = runtime;
        this.#engine = engine;
        Object.freeze(this);
    }

    /**
     * @description Creates a component runtime bound to an externally owned reactive runtime.
     * @param runtime - Reactive runtime used without transferring its ownership.
     * @returns A frozen public component runtime.
     */
    static create(runtime: ReactiveRuntime): ComponentRuntimeContract {
        return new ComponentRuntime(runtime, componentEngine);
    }

    /**
     * @description Creates and initializes one component instance under an explicit owner.
     * @typeParam Inputs - Declarative input value shape of the component.
     * @typeParam Controller - Public object shape returned by component setup.
     * @param definition - Immutable reusable component definition.
     * @param options - Complete initial input snapshot and explicit owner scope.
     * @returns A public initialized instance, or `undefined` after a handled setup failure.
     */
    create<Inputs extends object, Controller extends object>(
        definition: ComponentDefinition<Inputs, Controller>,
        options: ComponentCreateOptionsType<Inputs>,
    ): ComponentInstanceContract<Inputs, Controller> | undefined {
        const lifecycle = this.#engine.create(this.#runtime, definition, options);

        return lifecycle === undefined ? undefined : ComponentInstance.create(lifecycle);
    }
}
