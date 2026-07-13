import type { ReadonlySignal } from "@lilium/core";
import type { ComponentInputValuesType, ComponentInstance } from "../../src/index.js";
import type { IComponentInstanceLifecycle } from "../../src/instance/contracts/internal/component-instance-lifecycle.contract.js";

type ExampleInputsType = {
    count: number;
    label?: string;
};

type ExampleControllerType = {
    reset(): void;
};

declare const instance: ComponentInstance<ExampleInputsType, ExampleControllerType>;
declare const lifecycle: IComponentInstanceLifecycle<ExampleInputsType, ExampleControllerType>;

const count: ReadonlySignal<number> = instance.inputs.count;
const label: ReadonlySignal<string | undefined> = instance.inputs.label;
const disposed: boolean = instance.disposed;

instance.controller.reset();
instance.dispose();
lifecycle.updateInputs({ count: 1, label: undefined });

const nextInputs: ComponentInputValuesType<ExampleInputsType> = {
    count: 2,
    label: "next",
};
lifecycle.updateInputs(nextInputs);

// @ts-expect-error Public instances cannot mutate their input lifecycle.
instance.updateInputs({ count: 1, label: undefined });

// @ts-expect-error Internal snapshots require optional keys explicitly.
lifecycle.updateInputs({ count: 1 });

// @ts-expect-error Component inputs expose read-only signals.
instance.inputs.count.set(2);

// @ts-expect-error The public controller reference is immutable.
instance.controller = { reset() {} };

void count;
void disposed;
void label;
void nextInputs;
