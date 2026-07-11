import type { Scope } from "@lilium/core";
import type {
    ComponentCreateOptionsType,
    ComponentDefinition,
    ComponentInputValuesType,
    ComponentInstance,
    ComponentRuntime,
} from "../../src/index.js";
import type { IComponentEngine } from "../../src/runtime/contracts/internal/component-engine.contract.js";

type ExampleInputsType = {
    count: number;
    label?: string;
};

type ExampleControllerType = {
    reset(): void;
};

declare const componentRuntime: ComponentRuntime;
declare const definition: ComponentDefinition<
    ExampleInputsType,
    ExampleControllerType
>;
declare const engine: IComponentEngine;
declare const owner: Scope;

const inputs: ComponentInputValuesType<ExampleInputsType> = {
    count: 1,
    label: undefined,
};
const options: ComponentCreateOptionsType<ExampleInputsType> = {
    inputs,
    owner,
};
const instance: ComponentInstance<
    ExampleInputsType,
    ExampleControllerType
> | undefined = componentRuntime.create(definition, options);

// @ts-expect-error Complete input snapshots require optional keys explicitly.
const incompleteInputs: ComponentInputValuesType<ExampleInputsType> = { count: 1 };

// @ts-expect-error Component creation requires an explicit owner.
componentRuntime.create(definition, { inputs });

// @ts-expect-error Internal engines are not part of the public component runtime surface.
const publicEngine: IComponentEngine = componentRuntime;

void engine;
void incompleteInputs;
void instance;
void publicEngine;
