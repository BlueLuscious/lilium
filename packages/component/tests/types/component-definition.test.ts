import type {
    ComponentControllerType,
    ComponentDefinition,
    ComponentInputsType,
    ComponentSetupContext,
    ComponentSetupFunctionType,
} from "../../src/index.js";

type CounterInputsType = {
    initial: number;
    label?: string;
};

type CounterControllerType = {
    readonly count: number;
    increment(): void;
};

type CounterSetupFunctionType = ComponentSetupFunctionType<
    CounterInputsType,
    CounterControllerType
>;

declare const context: ComponentSetupContext;
declare const inputs: ComponentInputsType<CounterInputsType>;

const initial: number = inputs.initial.get();
const label: string | undefined = inputs.label.get();

// @ts-expect-error Optional input signal values preserve undefined.
const requiredLabel: string = inputs.label.get();

const setup: CounterSetupFunctionType = (currentContext, currentInputs) => {
    const count = currentContext.runtime.signal(currentInputs.initial.get());

    return {
        get count() {
            return count.get();
        },
        increment() {
            count.update((value) => value + 1);
        },
    };
};

const definition: ComponentDefinition<
    CounterInputsType,
    CounterControllerType
> = { setup };

const controller: ComponentControllerType<CounterControllerType> = definition.setup(
    context,
    inputs,
);

// @ts-expect-error Inputs expose read-only signals.
inputs.initial.set(1);

// @ts-expect-error Optional input keys remain present as signals.
const missingLabel: undefined = inputs.label;

// @ts-expect-error Async setup cannot produce the declared controller.
const asyncSetup: CounterSetupFunctionType = async () => ({
    count: 0,
    increment() {},
});

void asyncSetup;
void controller;
void initial;
void label;
void missingLabel;
void requiredLabel;
