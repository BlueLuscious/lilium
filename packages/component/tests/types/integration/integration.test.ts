import type { ReactiveRuntime, Scope } from "@lilium/core";
import type { ComponentDefinition, ComponentInstance } from "../../../src/index.js";
import type {
    ComponentIntegrationApi,
    ComponentOccurrence,
    ComponentOccurrenceRuntime,
} from "../../../src/integration/index.js";
import { ComponentIntegration } from "../../../src/integration/index.js";

// @ts-expect-error Integration authority is not exported from the Component package root.
type RootComponentIntegrationApi = import("../../../src/index.js").ComponentIntegrationApi;

type InputsType = {
    count: number;
    label?: string;
};

type ControllerType = {
    readonly value: number;
};

declare const api: ComponentIntegrationApi;
declare const definition: ComponentDefinition<InputsType, ControllerType>;
declare const owner: Scope;
declare const rootApi: RootComponentIntegrationApi;
declare const runtime: ReactiveRuntime;

const occurrenceRuntime: ComponentOccurrenceRuntime = api.createRuntime(runtime);
const concreteApi: ComponentIntegrationApi = ComponentIntegration;
const occurrence: ComponentOccurrence<InputsType, ControllerType> | undefined =
    occurrenceRuntime.create(definition, {
        inputs: { count: 1, label: undefined },
        owner,
    });

if (occurrence !== undefined) {
    const attachment: Scope = occurrence.attachment;
    const instance: ComponentInstance<InputsType, ControllerType> = occurrence.instance;

    occurrence.updateInputs({ count: 2, label: "ready" });
    occurrence.updateInputs({ count: 3, label: undefined });
    occurrence.dispose();

    // @ts-expect-error Complete snapshots cannot omit optional input declarations.
    occurrence.updateInputs({ count: 4 });

    // @ts-expect-error The public instance never receives input mutation authority.
    instance.updateInputs({ count: 5, label: undefined });

    // @ts-expect-error The occurrence does not expose its private component scope.
    occurrence.scope;

    // @ts-expect-error The occurrence does not expose its mutable lifecycle.
    occurrence.lifecycle;

    void attachment;
    void instance;
}

// @ts-expect-error The integration runtime does not expose the private engine.
occurrenceRuntime.engine;

void rootApi;
void concreteApi;
