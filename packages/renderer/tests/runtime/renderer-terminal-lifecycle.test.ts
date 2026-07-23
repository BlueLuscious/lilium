import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Component } from "@lilium/component";
import { Runtime } from "@lilium/core";
import { type ComponentTemplateStateType, Template } from "@lilium/template";
import { type RenderedApplication, Renderer } from "../../src/index.js";
import { createTestHost } from "./renderer-host.fixture.js";

const Group = Template.primitive("Group");
const Label = Template.primitive<{ text: string }>("Label");
const LabelText = Template.property<string, typeof Label>(Label, "text");

describe("renderer terminal lifecycle", () => {
    test("unmounts in reverse order and closes once under reentrant repeated disposal", () => {
        const runtime = Runtime.create();
        let rendered: RenderedApplication | undefined;
        const fixture = createTestHost(
            [
                { requested: Group, acceptsChildren: true },
                { requested: Label, properties: [{ requested: LabelText }] },
            ],
            {
                onRemove() {
                    assert.equal(rendered?.disposed, true);
                    rendered?.dispose();
                },
            },
        );
        const renderer = Renderer.createRuntime(runtime, fixture.host);
        const root = { name: "terminal" };
        const definition = Template.define({
            roots: [
                Template.node(Group, {
                    children: [
                        Template.node(Label, {
                            properties: [Template.value(LabelText, "Mounted")],
                        }),
                    ],
                }),
            ],
        });

        rendered = renderer.mountTemplate(definition, { root, state: {} });
        assert.ok(rendered);
        assert.equal(Object.isFrozen(renderer), true);
        const terminalStart = fixture.trace.length;

        rendered.dispose();
        rendered.dispose();

        assert.equal(rendered.disposed, true);
        assert.deepEqual(
            fixture.trace.slice(terminalStart).map(({ operation }) => operation),
            ["remove", "remove", "release", "release", "close"],
        );
        assert.equal(fixture.counters.close, 1);
        assert.equal(fixture.counters.remove, 2);
        assert.equal(fixture.counters.release, 2);

        const remounted = renderer.mountTemplate(Template.define({ roots: [] }), {
            root,
            state: {},
        });
        assert.ok(remounted);
        remounted.dispose();
        assert.equal(fixture.counters.close, 2);
        runtime.dispose();
    });

    test("observes terminal state when an external owner disposes the application", () => {
        const runtime = Runtime.create();
        const owner = runtime.scope();
        const fixture = createTestHost([{ requested: Label }]);
        const renderer = Renderer.createRuntime(runtime, fixture.host);
        const rendered = renderer.mountTemplate(
            Template.define({ roots: [Template.node(Label)] }),
            {
                root: { name: "owned" },
                state: {},
                owner,
            },
        );
        assert.ok(rendered);

        owner.dispose();

        assert.equal(rendered.disposed, true);
        assert.equal(fixture.counters.remove, 1);
        assert.equal(fixture.counters.release, 1);
        assert.equal(fixture.counters.close, 1);
        assert.doesNotThrow(() => rendered.dispose());
        runtime.dispose();
    });

    test("rolls back partial construction and returns undefined after a handled failure", () => {
        const runtime = Runtime.create();
        const failure = new Error("initial property write failed");
        const owner = runtime.scope();
        let handled = 0;
        const boundary = owner.boundary((event) => {
            assert.equal(event.error, failure);
            handled += 1;
            return "handled";
        });
        const fixture = createTestHost([
            {
                requested: Label,
                properties: [
                    {
                        requested: LabelText,
                        onWrite() {
                            throw failure;
                        },
                    },
                ],
            },
        ]);
        const renderer = Renderer.createRuntime(runtime, fixture.host);
        const definition = Template.define({
            roots: [
                Template.node(Label, {
                    properties: [Template.value(LabelText, "Failure")],
                }),
            ],
        });

        const rendered = renderer.mountTemplate(definition, {
            root: { name: "handled" },
            state: {},
            owner: boundary,
        });

        assert.equal(rendered, undefined);
        assert.equal(handled, 1);
        assert.deepEqual(
            fixture.trace.map(({ operation }) => operation),
            ["create", "release", "close"],
        );
        runtime.dispose();
    });

    test("rolls back attached descendants after propagated root placement failure", () => {
        const runtime = Runtime.create();
        const failure = new Error("root placement failed");
        const fixture = createTestHost(
            [{ requested: Group, acceptsChildren: true }, { requested: Label }],
            {
                onPlace(value, parent) {
                    if (value.id === 1 && parent.id === 0) {
                        throw failure;
                    }
                },
            },
        );
        const renderer = Renderer.createRuntime(runtime, fixture.host);
        const definition = Template.define({
            roots: [Template.node(Group, { children: [Template.node(Label)] })],
        });

        assert.throws(
            () => renderer.mountTemplate(definition, { root: { name: "placement" }, state: {} }),
            (error) => error === failure,
        );
        assert.deepEqual(
            fixture.trace.map(({ operation }) => operation),
            ["create", "create", "place", "remove", "release", "release", "close"],
        );
        assert.equal(fixture.counters.close, 1);
        runtime.dispose();
    });

    test("terminalizes the complete application after a dynamic host failure", () => {
        const runtime = Runtime.create();
        const source = runtime.signal("Ready");
        const failure = new Error("dynamic write failed");
        const fixture = createTestHost([
            {
                requested: Label,
                properties: [
                    {
                        requested: LabelText,
                        onWrite(_value, candidate) {
                            if (candidate === "Failure") {
                                throw failure;
                            }
                        },
                    },
                ],
            },
        ]);
        const renderer = Renderer.createRuntime(runtime, fixture.host);
        const definition = Template.define({
            roots: [
                Template.node(Label, {
                    properties: [Template.binding(LabelText, () => source.get())],
                }),
            ],
        });
        const rendered = renderer.mountTemplate(definition, {
            root: { name: "dynamic" },
            state: {},
        });
        assert.ok(rendered);
        const writes = fixture.counters.write;

        assert.throws(
            () => source.set("Failure"),
            (error) => error === failure,
        );
        assert.equal(rendered.disposed, true);
        assert.equal(fixture.counters.close, 1);
        assert.equal(fixture.counters.remove, 1);
        assert.equal(fixture.counters.release, 1);

        source.set("Ignored");
        assert.equal(fixture.counters.write, writes);
        runtime.dispose();
    });

    test("isolates a nested Component failure and cancels its parent input binding", () => {
        type InputsType = { value: string };

        const runtime = Runtime.create();
        const source = runtime.signal("Ready");
        const failure = new Error("nested visual failed");
        const behavior = Component.define<InputsType, object>({ setup: () => ({}) });
        const visual = Template.define<ComponentTemplateStateType<InputsType, object>>({
            roots: [
                Template.node(Label, {
                    properties: [Template.binding(LabelText, ({ inputs }) => inputs.value.get())],
                }),
            ],
        });
        const composition = Template.compose(behavior, visual);
        const definition = Template.define({
            roots: [
                Template.component(composition, {
                    inputs: () => ({ value: source.get() }),
                }),
                Template.node(Group),
            ],
        });
        const fixture = createTestHost([
            { requested: Group },
            {
                requested: Label,
                properties: [
                    {
                        requested: LabelText,
                        onWrite(_value, candidate) {
                            if (candidate === "Failure") {
                                throw failure;
                            }
                        },
                    },
                ],
            },
        ]);
        const renderer = Renderer.createRuntime(runtime, fixture.host);
        const rendered = renderer.mountTemplate(definition, {
            root: { name: "nested-component" },
            state: {},
        });
        assert.ok(rendered);

        assert.throws(
            () => source.set("Failure"),
            (error) => error === failure,
        );
        assert.equal(rendered.disposed, false);
        assert.equal(fixture.counters.close, 0);
        assert.equal(fixture.counters.remove, 1);
        assert.equal(fixture.counters.release, 1);
        const writes = fixture.counters.write;

        source.set("Ignored");
        assert.equal(fixture.counters.write, writes);

        rendered.dispose();
        assert.equal(fixture.counters.close, 1);
        assert.equal(fixture.counters.remove, 2);
        assert.equal(fixture.counters.release, 2);
        runtime.dispose();
    });

    test("terminalizes a root Component when its complete input update fails", () => {
        type InputsType = { value: number };
        type ControllerType = { read(): number };

        const runtime = Runtime.create();
        const failure = new Error("Component render failed");
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
        const composition = Template.compose(behavior, visual);
        const fixture = createTestHost([
            {
                requested: Label,
                properties: [
                    {
                        requested: LabelText,
                        onWrite(_value, candidate) {
                            if (candidate === "2") {
                                throw failure;
                            }
                        },
                    },
                ],
            },
        ]);
        const renderer = Renderer.createRuntime(runtime, fixture.host);
        const rendered = renderer.mountComponent(composition, {
            root: { name: "component" },
            inputs: { value: 1 },
        });
        assert.ok(rendered);

        assert.throws(
            () => rendered.update({ value: 2 }),
            (error) => error === failure,
        );
        assert.equal(rendered.disposed, true);
        assert.equal(rendered.component.disposed, true);
        assert.throws(() => rendered.update({ value: 3 }), /disposed rendered application/i);
        assert.equal(fixture.counters.close, 1);
        runtime.dispose();
    });

    test("routes public Component instance disposal through the rendered application", () => {
        const runtime = Runtime.create();
        const behavior = Component.define<object, object>({ setup: () => ({}) });
        const visual = Template.define<ComponentTemplateStateType<object, object>>({
            roots: [Template.node(Label)],
        });
        const fixture = createTestHost([{ requested: Label }]);
        const renderer = Renderer.createRuntime(runtime, fixture.host);
        const rendered = renderer.mountComponent(Template.compose(behavior, visual), {
            root: { name: "component-instance-disposal" },
            inputs: {},
        });
        assert.ok(rendered);

        rendered.component.dispose();

        assert.equal(rendered.disposed, true);
        assert.equal(rendered.component.disposed, true);
        assert.equal(fixture.counters.remove, 1);
        assert.equal(fixture.counters.release, 1);
        assert.equal(fixture.counters.close, 1);
        assert.doesNotThrow(() => rendered.dispose());
        runtime.dispose();
    });

    test("attempts every cleanup and releases the root claim after close failure", () => {
        const runtime = Runtime.create();
        const releaseSecond = new Error("release second failed");
        const releaseFirst = new Error("release first failed");
        const closeFailure = new Error("close failed");
        const root = { name: "cleanup-errors" };
        const fixture = createTestHost([{ requested: Group }, { requested: Label }], {
            onRelease(value) {
                throw value.id === 2 ? releaseSecond : releaseFirst;
            },
            onClose() {
                throw closeFailure;
            },
        });
        const renderer = Renderer.createRuntime(runtime, fixture.host);
        const definition = Template.define({
            roots: [Template.node(Group), Template.node(Label)],
        });
        const rendered = renderer.mountTemplate(definition, { root, state: {} });
        assert.ok(rendered);

        assert.throws(
            () => rendered.dispose(),
            (error) => {
                assert.ok(error instanceof AggregateError);
                assert.deepEqual(error.errors, [releaseSecond, releaseFirst, closeFailure]);
                return true;
            },
        );
        assert.equal(rendered.disposed, true);
        assert.equal(fixture.counters.release, 2);
        assert.equal(fixture.counters.close, 1);

        const remounted = renderer.mountTemplate(Template.define({ roots: [] }), {
            root,
            state: {},
        });
        assert.ok(remounted);
        assert.throws(
            () => remounted.dispose(),
            (error) => error === closeFailure,
        );
        assert.equal(fixture.counters.close, 2);
        runtime.dispose();
    });
});
