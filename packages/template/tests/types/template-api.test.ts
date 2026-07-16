import type { ComponentDefinition } from "@lilium/component";
import type { ReadonlySignal } from "@lilium/core";
import {
    type ComponentTemplateStateType,
    Template,
    type TemplateApi,
    type TemplateBinding,
    type TemplateDefinition,
    type TemplatedComponentDefinition,
    type TemplatePrimitive,
    type TemplateProjectionStateType,
    type TemplateProperty,
    type TemplateSlot,
} from "../../src/index.js";

type CounterInputsType = {
    initial: number;
};

type CounterControllerType = {
    readonly count: ReadonlySignal<number>;
};

type ActionInputsType = {
    label: string;
};

type ActionControllerType = {
    invoke(): void;
};

type ActionSlotInputsType = {
    active: boolean;
};

type ParentStateType = {
    readonly label: ReadonlySignal<string>;
};

declare const CompleteTemplate: TemplateApi;
declare const CounterBehavior: ComponentDefinition<CounterInputsType, CounterControllerType>;
declare const ActionBehavior: ComponentDefinition<ActionInputsType, ActionControllerType>;

const Stack = Template.primitive("Stack");
const StackGap = Template.property<number>(Stack, "gap");
const Label = Template.primitive("Label");
const LabelValue = Template.property<string>(Label, "value");
const ActionContent = CompleteTemplate.slot<ActionSlotInputsType>("content");

const CounterView = Template.define<
    ComponentTemplateStateType<CounterInputsType, CounterControllerType>
>({
    roots: [
        Template.node(Stack, {
            properties: [Template.value(StackGap, 8)],
            children: [
                Template.node(Label, {
                    properties: [
                        Template.binding(
                            LabelValue,
                            ({ controller }) => `Count: ${controller.count.get()}`,
                        ),
                    ],
                }),
            ],
        }),
    ],
});
const Counter = Template.compose(CounterBehavior, CounterView);

const ActionView = Template.define<
    ComponentTemplateStateType<ActionInputsType, ActionControllerType>
>({
    roots: [
        CompleteTemplate.outlet(ActionContent, {
            inputs: ({ inputs }) => ({ active: inputs.label.get().length > 0 }),
            fallback: [Template.node(Label, { properties: [Template.value(LabelValue, "Empty")] })],
        }),
    ],
});
const Action = Template.compose(ActionBehavior, ActionView);
const NestedCounter = Template.component(Counter, {
    inputs: () => ({ initial: 1 }),
});
const StaticAction = Template.component(Action, {
    inputs: { label: "Run" },
});
const ActionProjection = Template.define<
    TemplateProjectionStateType<ParentStateType, ActionSlotInputsType>
>({
    roots: [
        Template.node(Label, {
            properties: [
                Template.binding(LabelValue, ({ parent, slot }) =>
                    slot.active.get() ? parent.label.get() : "Inactive",
                ),
            ],
        }),
    ],
});
const ParentView = Template.define<ParentStateType>({
    roots: [
        CompleteTemplate.component(Action, {
            inputs: ({ label }) => ({ label: label.get() }),
            projections: [{ slot: ActionContent, template: ActionProjection }],
        }),
    ],
});

const api: TemplateApi = CompleteTemplate;
const implementedApi: Pick<
    TemplateApi,
    "binding" | "component" | "compose" | "define" | "node" | "primitive" | "property" | "value"
> = Template;
const primitive: TemplatePrimitive = Stack;
const property: TemplateProperty<typeof Label, string> = LabelValue;
const slot: TemplateSlot<ActionSlotInputsType> = ActionContent;
const definition: TemplateDefinition<ParentStateType> = ParentView;
const composition: TemplatedComponentDefinition<CounterInputsType, CounterControllerType> = Counter;
const binding: TemplateBinding<ParentStateType, typeof Label, string, undefined> = Template.binding(
    LabelValue,
    ({ label }: Readonly<ParentStateType>) => label.get(),
);

// @ts-expect-error Static property values must match their property capability.
Template.value(LabelValue, 1);

Template.component(Action, {
    // @ts-expect-error Nested component input evaluators must return complete snapshots.
    inputs: () => ({}),
});

Template.component(Action, {
    // @ts-expect-error Static nested component inputs must contain every declared key.
    inputs: {},
});

// @ts-expect-error Binding evaluators cannot return Promise-like values for string properties.
Template.binding(LabelValue, async () => "invalid");

void api;
void binding;
void composition;
void definition;
void implementedApi;
void NestedCounter;
void primitive;
void property;
void slot;
void StaticAction;
