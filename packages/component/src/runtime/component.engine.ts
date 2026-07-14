import type { ReactiveRuntime, Scope } from "@lilium/core";
import type { ComponentDefinition } from "../component/contracts/component-definition.contract.js";
import type { ComponentControllerType } from "../controller/types/component-controller.type.js";
import { ComponentInputStore } from "../inputs/runtime/component-input.store.js";
import type { ComponentInputValuesType } from "../inputs/types/component-input-values.type.js";
import type { IComponentInstanceLifecycle } from "../instance/contracts/internal/component-instance-lifecycle.contract.js";
import { ComponentInstanceLifecycle } from "../instance/runtime/component-instance-lifecycle.js";
import type { ComponentSetupContext } from "../setup/contracts/component-setup-context.contract.js";
import type { ComponentSetupFunctionType } from "../setup/types/component-setup-function.type.js";
import type { IComponentEngine } from "./contracts/internal/component-engine.contract.js";
import type { ComponentCreateOptionsType } from "./types/component-create-options.type.js";

/**
 * @description Internal object that creates component instances atomically.
 * @remarks Runtime validation occurs before setup where erased TypeScript metadata permits it.
 * Every scope created by this engine either becomes one initialized lifecycle or is disposed.
 */
class ComponentEngine implements IComponentEngine {
    /**
     * @description Creates, sets up, and materializes one owned component lifecycle.
     * @typeParam Inputs - Declarative input value shape of the component.
     * @typeParam Controller - Public object shape returned by component setup.
     * @param runtime - Reactive runtime used for ownership and reactive input signals.
     * @param definition - Immutable reusable component definition.
     * @param options - Complete initial input snapshot and explicit owner scope.
     * @returns The initialized lifecycle, or `undefined` after a handled creation failure.
     */
    create<Inputs extends object, Controller extends object>(
        runtime: ReactiveRuntime,
        definition: ComponentDefinition<Inputs, Controller>,
        options: ComponentCreateOptionsType<Inputs>,
    ): IComponentInstanceLifecycle<Inputs, Controller> | undefined {
        const setup = this.#setupOf(definition);
        const [values, owner] = this.#valuesAndOwnerOf(options);
        const scope = runtime.scope(owner);
        let controller: ComponentControllerType<Controller> | undefined;
        let inputStore: ComponentInputStore<Inputs> | undefined;
        let setupCompleted = false;

        try {
            scope.run(() => {
                inputStore = new ComponentInputStore(runtime, values);
                const context: ComponentSetupContext = Object.freeze({ runtime, scope });
                const candidate = setup(context, inputStore.inputs);
                this.#assertController(candidate);
                controller = candidate;
                setupCompleted = true;
                return undefined;
            });

            if (!setupCompleted || controller === undefined || inputStore === undefined) {
                scope.dispose();
                return undefined;
            }

            return new ComponentInstanceLifecycle(scope, controller, inputStore);
        } catch (error) {
            return this.#rethrowAfterDisposal(scope, error);
        }
    }

    /**
     * @description Determines whether a runtime value is a non-array object.
     * @param value - Runtime value being inspected.
     * @returns Whether the value can represent a component definition, options, or controller.
     */
    #isObject(value: unknown): value is object {
        return typeof value === "object" && value !== null && !Array.isArray(value);
    }

    /**
     * @description Validates and captures the synchronous setup operation of one definition.
     * @typeParam Inputs - Declarative input value shape of the component.
     * @typeParam Controller - Public object shape returned by component setup.
     * @param definition - Candidate component definition received by the internal engine.
     * @returns The validated synchronous setup operation.
     */
    #setupOf<Inputs extends object, Controller extends object>(
        definition: ComponentDefinition<Inputs, Controller>,
    ): ComponentSetupFunctionType<Inputs, Controller> {
        if (!this.#isObject(definition)) {
            throw new TypeError("A component definition must be a non-array object.");
        }

        const setup: unknown = Reflect.get(definition, "setup");

        if (typeof setup !== "function") {
            throw new TypeError("A component definition must expose a synchronous setup function.");
        }

        return setup as ComponentSetupFunctionType<Inputs, Controller>;
    }

    /**
     * @description Validates and captures complete input values and an explicit owner scope.
     * @typeParam Inputs - Declarative input value shape of the component.
     * @param options - Candidate component creation options received by the internal engine.
     * @returns The validated input snapshot and owner candidate.
     */
    #valuesAndOwnerOf<Inputs extends object>(
        options: ComponentCreateOptionsType<Inputs>,
    ): readonly [ComponentInputValuesType<Inputs>, Scope] {
        if (!this.#isObject(options)) {
            throw new TypeError("Component creation options must be a non-array object.");
        }

        const inputs: unknown = Reflect.get(options, "inputs");
        const owner: unknown = Reflect.get(options, "owner");

        if (!this.#isObject(inputs)) {
            throw new TypeError("Component inputs must be a normalized non-array object snapshot.");
        }

        if (!this.#isObject(owner)) {
            throw new TypeError("Component creation requires an explicit owner scope.");
        }

        return [inputs as ComponentInputValuesType<Inputs>, owner as Scope];
    }

    /**
     * @description Rejects unsupported controller results before an instance can escape setup.
     * @param controller - Runtime value returned by component setup.
     * @returns Nothing when the controller is a synchronous non-array object.
     */
    #assertController(controller: unknown): void {
        if (!this.#isObject(controller)) {
            throw new TypeError("Component setup must return a controller object.");
        }

        if (typeof Reflect.get(controller, "then") === "function") {
            throw new TypeError(
                "Component setup must return synchronously, not a Promise-like object.",
            );
        }
    }

    /**
     * @description Disposes incomplete component ownership and preserves every resulting failure.
     * @param scope - Child component scope that must not escape failed creation.
     * @param creationError - Original propagated creation failure.
     * @returns This operation never returns because the original or combined failure is thrown.
     */
    #rethrowAfterDisposal(scope: Scope, creationError: unknown): never {
        try {
            scope.dispose();
        } catch (disposalError) {
            throw new AggregateError(
                [creationError, disposalError],
                "Component creation and incomplete scope disposal both failed.",
            );
        }

        throw creationError;
    }
}

/** @description Frozen internal component creation engine shared by the package runtime. */
export const componentEngine: IComponentEngine = Object.freeze(new ComponentEngine());
