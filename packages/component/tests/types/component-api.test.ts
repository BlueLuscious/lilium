import type { ReactiveRuntime } from "@lilium/core";
import {
    Component,
    type ComponentApi,
    type ComponentDefinition,
    type ComponentInputsType,
    type ComponentRuntime,
    type ComponentSetupContext,
} from "../../src/index.js";

type CounterInputsType = {
    initial: number;
};

type CounterControllerType = {
    increment(): void;
};

declare const reactiveRuntime: ReactiveRuntime;

const api: ComponentApi = Component;
const definition = Component.define<CounterInputsType, CounterControllerType>({
    setup(context: ComponentSetupContext, inputs: ComponentInputsType<CounterInputsType>) {
        const count = context.runtime.signal(inputs.initial.get());

        return {
            increment() {
                count.update((value) => value + 1);
            },
        };
    },
});
const reusableDefinition: ComponentDefinition<CounterInputsType, CounterControllerType> =
    definition;
const componentRuntime: ComponentRuntime = Component.createRuntime(reactiveRuntime);

Component.define<CounterInputsType, CounterControllerType>({
    // @ts-expect-error Definitions cannot use asynchronous setup.
    async setup() {
        return { increment() {} };
    },
});

// @ts-expect-error Component runtimes require a reactive runtime.
Component.createRuntime();

void api;
void componentRuntime;
void reusableDefinition;
