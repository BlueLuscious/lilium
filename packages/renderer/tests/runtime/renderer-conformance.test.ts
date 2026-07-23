import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Runtime, type Signal } from "@lilium/core";
import { Template } from "@lilium/template";
import { Renderer } from "../../src/index.js";
import { createTestHost } from "./renderer-host.fixture.js";

const Group = Template.primitive<{ gap: number }>("Group");
const GroupGap = Template.property<number, typeof Group>(Group, "gap");
const Label = Template.primitive<{ text: string }>("Label");
const LabelText = Template.property<string, typeof Label>(Label, "text");

function callOperations(fixture: ReturnType<typeof createTestHost>): readonly string[] {
    return fixture.calls.map(({ operation }) => operation);
}

describe("renderer host-neutral conformance", () => {
    test("records preflight, detached construction, equal suppression, updates, and unmount", () => {
        type StateType = { readonly value: Signal<number> };

        const runtime = Runtime.create();
        const value = runtime.signal(0);
        const fixture = createTestHost([
            {
                requested: Group,
                acceptsChildren: true,
                properties: [{ requested: GroupGap }],
            },
            { requested: Label, properties: [{ requested: LabelText }] },
        ]);
        const renderer = Renderer.createRuntime(runtime, fixture.host);
        const definition = Template.define<StateType>({
            roots: [
                Template.node(Group, {
                    properties: [Template.value(GroupGap, 8)],
                    children: [
                        Template.node(Label, {
                            properties: [
                                Template.binding(LabelText, (state) =>
                                    String(Math.floor(state.value.get() / 10)),
                                ),
                            ],
                        }),
                    ],
                }),
            ],
        });

        const rendered = renderer.mountTemplate(definition, {
            root: { name: "conformance" },
            state: { value },
        });
        assert.ok(rendered);
        assert.deepEqual(callOperations(fixture), [
            "open",
            "resolve-primitive",
            "resolve-property",
            "resolve-primitive",
            "resolve-property",
            "create",
            "write",
            "create",
            "write",
            "place",
            "place",
        ]);
        assert.equal(fixture.counters.write, 2);

        value.set(1);
        assert.equal(fixture.counters.write, 2);
        assert.equal(callOperations(fixture).at(-1), "place");

        value.set(10);
        assert.equal(fixture.counters.write, 3);
        assert.equal(callOperations(fixture).at(-1), "write");

        rendered.dispose();
        rendered.dispose();
        assert.deepEqual(callOperations(fixture).slice(-5), [
            "remove",
            "remove",
            "release",
            "release",
            "close",
        ]);
        assert.equal(fixture.counters.close, 1);
        runtime.dispose();
    });

    test("stops after failed preflight without constructing a host value", () => {
        const runtime = Runtime.create();
        const fixture = createTestHost([{ requested: Label }]);
        const renderer = Renderer.createRuntime(runtime, fixture.host);
        const definition = Template.define({
            roots: [
                Template.node(Label, {
                    properties: [Template.value(LabelText, "Unsupported")],
                }),
            ],
        });

        assert.throws(
            () =>
                renderer.mountTemplate(definition, {
                    root: { name: "preflight-failure" },
                    state: {},
                }),
            /missing-property/i,
        );
        assert.deepEqual(callOperations(fixture), [
            "open",
            "resolve-primitive",
            "resolve-property",
            "close",
        ]);
        assert.equal(fixture.counters.create, 0);
        assert.equal(fixture.counters.write, 0);
        assert.equal(fixture.counters.place, 0);
        runtime.dispose();
    });

    test("records attempted placement and deterministic rollback after injected failure", () => {
        const runtime = Runtime.create();
        const failure = new Error("injected root placement failure");
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
            () =>
                renderer.mountTemplate(definition, {
                    root: { name: "placement-failure" },
                    state: {},
                }),
            (error) => error === failure,
        );
        assert.deepEqual(callOperations(fixture), [
            "open",
            "resolve-primitive",
            "resolve-primitive",
            "create",
            "create",
            "place",
            "place",
            "remove",
            "release",
            "release",
            "close",
        ]);
        assert.equal(fixture.counters.close, 1);
        runtime.dispose();
    });
});
