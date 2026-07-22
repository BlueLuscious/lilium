import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Component } from "@lilium/component";
import { Runtime, type Signal } from "@lilium/core";
import {
    type ComponentTemplateStateType,
    Template,
    type TemplateProjectionStateType,
} from "@lilium/template";
import { RendererInstructionExecutor } from "../../src/execution/runtime/renderer-instruction.executor.js";
import { RendererSessionManager } from "../../src/session/runtime/renderer-session.manager.js";
import { createTestHost } from "./renderer-host.fixture.js";

const Label = Template.primitive<{ text: string }>("Label");
const LabelText = Template.property<string, typeof Label>(Label, "text");

function createExecutor(
    runtime: ReturnType<typeof Runtime.create>,
    fixture: ReturnType<typeof createTestHost>,
    definition: ReturnType<typeof Template.define<object>>,
) {
    const session = new RendererSessionManager(fixture.host).open({ name: "integration" });
    session.preflightTemplate(definition);
    return new RendererInstructionExecutor(session, runtime, (error) => {
        assert.fail(`Successful Renderer integration cannot terminalize: ${String(error)}`);
    });
}

describe("renderer reactive and Component integration", () => {
    test("retraces property dependencies, suppresses equal writes, and renders before effects", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        const selectFirst = runtime.signal(true);
        const first = runtime.signal(0);
        const second = runtime.signal(10);
        const noise = runtime.signal(0);
        const equalityDependency = runtime.signal(0);
        const order: string[] = [];
        let evaluations = 0;
        const fixture = createTestHost([
            {
                requested: Label,
                properties: [
                    {
                        requested: LabelText,
                        onWrite(_value, candidate) {
                            order.push(`render:${String(candidate)}`);
                        },
                    },
                ],
            },
        ]);
        const definition = Template.define({
            roots: [
                Template.node(Label, {
                    properties: [
                        Template.binding(
                            LabelText,
                            () => {
                                evaluations += 1;
                                noise.get();
                                return String(selectFirst.get() ? first.get() : second.get());
                            },
                            {
                                equal(previous, next) {
                                    equalityDependency.get();
                                    return previous === next;
                                },
                            },
                        ),
                    ],
                }),
            ],
        });
        const executor = createExecutor(runtime, fixture, definition);

        runtime.effect(() => {
            order.push(`effect:${selectFirst.get() ? first.get() : second.get()}`);
        });
        executor.executeTemplate(definition, {}, owner);
        order.length = 0;

        noise.set(1);
        assert.deepEqual(order, []);
        assert.equal(evaluations, 2);

        equalityDependency.set(1);
        assert.equal(evaluations, 2);

        first.set(1);
        assert.deepEqual(order, ["render:1", "effect:1"]);
        order.length = 0;

        selectFirst.set(false);
        assert.deepEqual(order, ["render:10", "effect:10"]);
        order.length = 0;

        first.set(2);
        assert.deepEqual(order, []);
        second.set(11);
        assert.deepEqual(order, ["render:11", "effect:11"]);
    });

    test("updates complete nested Component inputs before eligible effects", () => {
        type ChildInputsType = { value: number };
        type ChildControllerType = { read(): number };
        type ParentStateType = { value: Signal<number> };

        const runtime = Runtime.create();
        const owner = runtime.scope();
        const source = runtime.signal(1);
        const order: string[] = [];
        const behavior = Component.define<ChildInputsType, ChildControllerType>({
            setup(context, inputs) {
                context.runtime.effect(() => {
                    order.push(`effect:${inputs.value.get()}`);
                });
                return { read: () => inputs.value.get() };
            },
        });
        const visual = Template.define<
            ComponentTemplateStateType<ChildInputsType, ChildControllerType>
        >({
            roots: [
                Template.node(Label, {
                    properties: [
                        Template.binding(LabelText, ({ inputs }) => String(inputs.value.get())),
                    ],
                }),
            ],
        });
        const child = Template.compose(behavior, visual);
        const definition = Template.define<ParentStateType>({
            roots: [
                Template.component(child, {
                    inputs: (state) => ({ value: state.value.get() }),
                }),
            ],
        });
        const fixture = createTestHost([
            {
                requested: Label,
                properties: [
                    {
                        requested: LabelText,
                        onWrite(_value, candidate) {
                            order.push(`render:${String(candidate)}`);
                        },
                    },
                ],
            },
        ]);
        const executor = createExecutor(runtime, fixture, definition);

        const occurrence = executor.executeTemplate(definition, { value: source }, owner);
        const component = occurrence.component<ChildInputsType, ChildControllerType>(0);
        order.length = 0;

        runtime.batch(() => {
            source.set(2);
            source.set(3);
        });

        assert.deepEqual(order, ["render:3", "effect:3"]);
        assert.equal(component.instance.inputs.value.get(), 3);
        assert.equal(component.instance.controller.read(), 3);
        assert.equal(fixture.counters.create, 1);
    });

    test("executes a root templated Component through its protected occurrence", () => {
        type InputsType = { value: number };
        type ControllerType = { read(): number };

        const runtime = Runtime.create();
        const owner = runtime.scope();
        const behavior = Component.define<InputsType, ControllerType>({
            setup(_context, inputs) {
                return { read: () => inputs.value.get() };
            },
        });
        const visual = Template.define<ComponentTemplateStateType<InputsType, ControllerType>>({
            roots: [
                Template.node(Label, {
                    properties: [
                        Template.binding(LabelText, ({ controller }) => String(controller.read())),
                    ],
                }),
            ],
        });
        const definition = Template.compose(behavior, visual);
        const fixture = createTestHost([
            { requested: Label, properties: [{ requested: LabelText }] },
        ]);
        const session = new RendererSessionManager(fixture.host).open({ name: "root-component" });
        session.preflightComponent(definition);
        const executor = new RendererInstructionExecutor(session, runtime, (error) => {
            assert.fail(`Successful root Component cannot terminalize: ${String(error)}`);
        });

        const rendered = executor.executeComponent(definition, { value: 4 }, owner);

        assert.equal(rendered.component.instance.controller.read(), 4);
        assert.equal([...fixture.writes.values()][0]?.get(LabelText), "4");
        rendered.component.updateInputs({ value: 5 });
        assert.equal(rendered.component.instance.controller.read(), 5);
        assert.equal([...fixture.writes.values()][0]?.get(LabelText), "5");
        assert.equal(fixture.counters.create, 1);
    });

    test("projects parent-owned content through reactive child slot inputs", () => {
        type ChildControllerType = { slotValue(): string };
        type ParentStateType = { prefix: Signal<string> };
        type SlotInputsType = { value: string };

        const runtime = Runtime.create();
        const owner = runtime.scope();
        const prefix = runtime.signal("Parent");
        const slotSource = runtime.signal("First");
        const Content = Template.slot<SlotInputsType>("content");
        const Fallback = Template.primitive("Fallback");
        const behavior = Component.define<object, ChildControllerType>({
            setup() {
                return { slotValue: () => slotSource.get() };
            },
        });
        const childVisual = Template.define<
            ComponentTemplateStateType<object, ChildControllerType>
        >({
            roots: [
                Template.outlet(Content, {
                    inputs: ({ controller }) => ({ value: controller.slotValue() }),
                    fallback: [Template.node(Fallback)],
                }),
            ],
        });
        const child = Template.compose(behavior, childVisual);
        const projectedVisual = Template.define<
            TemplateProjectionStateType<ParentStateType, SlotInputsType>
        >({
            roots: [
                Template.node(Label, {
                    properties: [
                        Template.binding(
                            LabelText,
                            ({ parent, slot }) => `${parent.prefix.get()}:${slot.value.get()}`,
                        ),
                    ],
                }),
            ],
        });
        const projection = Template.projection(Content, projectedVisual);
        const definition = Template.define<ParentStateType>({
            roots: [
                Template.component(child, {
                    inputs: {},
                    projections: [projection],
                }),
            ],
        });
        const fixture = createTestHost([
            { requested: Label, properties: [{ requested: LabelText }] },
        ]);
        const executor = createExecutor(runtime, fixture, definition);
        const occurrence = executor.executeTemplate(definition, { prefix }, owner);
        const component = occurrence.component(0);

        assert.equal(fixture.counters.create, 1);
        assert.equal(fixture.counters.write, 1);
        assert.equal([...fixture.writes.values()][0]?.get(LabelText), "Parent:First");

        slotSource.set("Second");
        assert.equal(fixture.counters.write, 2);
        assert.equal([...fixture.writes.values()][0]?.get(LabelText), "Parent:Second");

        prefix.set("Updated");
        assert.equal(fixture.counters.write, 3);
        assert.equal([...fixture.writes.values()][0]?.get(LabelText), "Updated:Second");

        component.dispose();
        slotSource.set("Ignored");
        prefix.set("Ignored");
        assert.equal(fixture.counters.write, 3);
    });

    test("executes fallback content without evaluating unused slot inputs", () => {
        let slotEvaluations = 0;
        const runtime = Runtime.create();
        const owner = runtime.scope();
        const Content = Template.slot<{ value: string }>("content");
        const Fallback = Template.primitive("Fallback");
        const behavior = Component.define<object, object>({ setup: () => ({}) });
        const childVisual = Template.define<ComponentTemplateStateType<object, object>>({
            roots: [
                Template.outlet(Content, {
                    inputs: () => {
                        slotEvaluations += 1;
                        return { value: "unused" };
                    },
                    fallback: [Template.node(Fallback)],
                }),
            ],
        });
        const child = Template.compose(behavior, childVisual);
        const definition = Template.define({
            roots: [Template.component(child, { inputs: {} })],
        });
        const fixture = createTestHost([{ requested: Fallback }]);
        const executor = createExecutor(runtime, fixture, definition);

        executor.executeTemplate(definition, {}, owner);

        assert.equal(slotEvaluations, 0);
        assert.equal(fixture.counters.create, 1);
        const root = fixture.roots[0];
        assert.ok(root);
        const fallbackValues = fixture.children.get(root);
        assert.ok(fallbackValues);
        const fallbackValue = fallbackValues[0];
        assert.ok(fallbackValue);
        assert.equal(fixture.primitivesByValue.get(fallbackValue), Fallback);
    });
});
