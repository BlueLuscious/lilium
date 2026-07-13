import type { ReactiveRuntime } from "@lilium/core";
import type {
    ComponentApi,
    ComponentDefinition,
    ComponentInputsType,
    ComponentRuntime,
    ComponentSetupContext,
} from "../../src/index.js";

type CounterInputsType = {
    initial: number;
};

type CounterControllerType = {
    increment(): void;
};

declare const api: ComponentApi;
declare const reactiveRuntime: ReactiveRuntime;

const definition = api.define<CounterInputsType, CounterControllerType>({
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
const componentRuntime: ComponentRuntime = api.createRuntime(reactiveRuntime);

api.define<CounterInputsType, CounterControllerType>({
    // @ts-expect-error Definitions cannot use asynchronous setup.
    async setup() {
        return { increment() {} };
    },
});

// @ts-expect-error Component runtimes require a reactive runtime.
api.createRuntime();

void componentRuntime;
void reusableDefinition;
