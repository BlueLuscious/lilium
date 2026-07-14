import type { ReactiveRuntime } from "@lilium/core";
import type { ComponentDefinition } from "../component/contracts/component-definition.contract.js";
import { ComponentRuntime } from "../runtime/component-runtime.js";
import type { ComponentRuntime as ComponentRuntimeContract } from "../runtime/contracts/component-runtime.contract.js";
import type { ComponentApi } from "./contracts/component-api.contract.js";

/**
 * @description Stateless object-oriented facade for the public Component domain.
 * @remarks Definitions are normalized without mutating caller-owned objects, while runtime
 * creation binds execution to Core without taking ownership or allocating component scopes.
 */
class ComponentFacade implements ComponentApi {
    /**
     * @description Creates an immutable reusable headless component definition.
     * @typeParam Inputs - Declarative input value shape accepted by the component.
     * @typeParam Controller - Public object shape returned by component setup.
     * @param definition - Candidate definition whose setup operation must be preserved.
     * @returns A normalized frozen definition containing only its setup operation.
     */
    define<Inputs extends object, Controller extends object>(
        definition: ComponentDefinition<Inputs, Controller>,
    ): ComponentDefinition<Inputs, Controller> {
        if (typeof definition !== "object" || definition === null || Array.isArray(definition)) {
            throw new TypeError("A component definition must be a non-array object.");
        }

        const setup: unknown = Reflect.get(definition, "setup");

        if (typeof setup !== "function") {
            throw new TypeError("A component definition must expose a synchronous setup function.");
        }

        return Object.freeze({
            setup,
        }) as ComponentDefinition<Inputs, Controller>;
    }

    /**
     * @description Creates a component runtime associated with one reactive runtime.
     * @param runtime - Externally owned reactive runtime used by component instances.
     * @returns A frozen component runtime that does not own the supplied reactive runtime.
     */
    createRuntime(runtime: ReactiveRuntime): ComponentRuntimeContract {
        return ComponentRuntime.create(runtime);
    }
}

/** @description Immutable stateless public facade for defining and executing components. */
export const Component: ComponentApi = Object.freeze(new ComponentFacade());
