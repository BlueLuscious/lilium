import type { ComponentDefinition, ComponentInputValuesType } from "@lilium/component";
import { Component } from "@lilium/component";
import type { ReactiveRuntime, ReadonlySignal } from "@lilium/core";
import { Runtime } from "@lilium/core";
import {
    type ComponentTemplateStateType,
    Template,
    type TemplateDefinition,
    type TemplatedComponentDefinition,
    type TemplateProjectionStateType,
} from "../../src/index.js";

type CounterInputsType = {
    initial: number;
    label: string | undefined;
};

type CounterControllerType = {
    readonly count: ReadonlySignal<number>;
    increment(): void;
};

type ContentInputsType = {
    active: boolean;
};

type ParentStateType = {
    readonly title: ReadonlySignal<string>;
};

const runtime: ReactiveRuntime = Runtime.create();
const CounterBehavior: ComponentDefinition<CounterInputsType, CounterControllerType> =
    Component.define({
        setup({ runtime }, inputs) {
            const count = runtime.signal(inputs.initial.get());
            return {
                count,
                increment() {
                    count.update((value) => value + 1);
                },
            };
        },
    });
const Label = Template.primitive("Label");
const LabelValue = Template.property<string>(Label, "value");
const Content = Template.slot<ContentInputsType>("content");
const CounterView = Template.define<
    ComponentTemplateStateType<CounterInputsType, CounterControllerType>
>({
    roots: [
        Template.node(Label, {
            properties: [
                Template.binding(
                    LabelValue,
                    ({ inputs, controller }) =>
                        inputs.label.get() ?? String(controller.count.get()),
                ),
            ],
            children: [
                Template.outlet(Content, {
                    inputs: ({ controller }) => ({ active: controller.count.get() > 0 }),
                }),
            ],
        }),
    ],
});
const Counter: TemplatedComponentDefinition<CounterInputsType, CounterControllerType> =
    Template.compose(CounterBehavior, CounterView);
const ContentView = Template.define<
    TemplateProjectionStateType<ParentStateType, ContentInputsType>
>({
    roots: [
        Template.node(Label, {
            properties: [
                Template.binding(LabelValue, ({ parent, slot }) =>
                    slot.active.get() ? parent.title.get() : "Inactive",
                ),
            ],
        }),
    ],
});
const ContentProjection = Template.projection(Content, ContentView);
const initialInputs: ComponentInputValuesType<CounterInputsType> = {
    initial: 1,
    label: undefined,
};
const ParentView: TemplateDefinition<ParentStateType> = Template.define({
    roots: [
        Template.component(Counter, {
            inputs: initialInputs,
            projections: [ContentProjection],
        }),
    ],
});

// @ts-expect-error Component snapshots imported from the public package require every input key.
const incompleteInputs: ComponentInputValuesType<CounterInputsType> = { initial: 1 };

// @ts-expect-error Projection templates must match the public slot input schema.
Template.projection(Content, CounterView);

runtime.dispose();
void incompleteInputs;
void ParentView;
