import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Runtime } from "@lilium/core";
import { Renderer } from "@lilium/renderer";
import { Template } from "@lilium/template";
import { RendererConsole } from "../../src/index.js";

const Group = Template.primitive<{ gap: number }>("Group");
const GroupGap = Template.property<number, typeof Group>(Group, "gap");
const Label = Template.primitive<{ text: string }>("Label");
const LabelText = Template.property<string, typeof Label>(Label, "text");

function createHost() {
    const group = RendererConsole.primitive(Group, {
        acceptsChildren: true,
        properties: [GroupGap],
    });
    const label = RendererConsole.primitive(Label, { properties: [LabelText] });
    return {
        group,
        label,
        host: RendererConsole.createHost({ primitives: [group, label] }),
    };
}

describe("Renderer Console private host adapter", () => {
    test("normalizes nominal immutable capability declarations", () => {
        const group = RendererConsole.primitive(Group, {
            acceptsChildren: true,
            properties: [GroupGap],
        });
        const label = RendererConsole.primitive(Label, { properties: [LabelText] });

        assert.equal(Object.isFrozen(RendererConsole), true);
        assert.equal(Object.isFrozen(group), true);
        assert.equal(Object.isFrozen(group.properties), true);
        assert.equal(group.primitive, Group);
        assert.equal(group.acceptsChildren, true);
        assert.deepEqual(group.properties, [GroupGap]);
        assert.throws(
            () =>
                RendererConsole.primitive(Group, {
                    properties: [GroupGap, GroupGap],
                }),
            /property more than once/i,
        );
        assert.throws(
            () =>
                RendererConsole.createHost({
                    primitives: [group, group],
                }),
            /primitive more than once/i,
        );
        assert.throws(
            () =>
                RendererConsole.createHost({
                    primitives: [
                        {
                            primitive: Label,
                            acceptsChildren: false,
                            properties: [LabelText],
                        },
                    ],
                }),
            /created by RendererConsole/i,
        );
        assert.doesNotThrow(() => RendererConsole.createHost({ primitives: [group, label] }));
    });

    test("executes the complete logical host lifecycle through opaque handles", () => {
        const { host } = createHost();
        const root = { name: "manual" };
        const session = host.open(root);
        const group = session.resolvePrimitive(Group);
        const label = session.resolvePrimitive(Label);
        assert.ok(group);
        assert.ok(label);
        const gap = group.resolveProperty(GroupGap);
        const text = label.resolveProperty(LabelText);
        assert.ok(gap);
        assert.ok(text);
        const groupValue = group.create();
        const labelValue = label.create();

        gap.write(groupValue, 8);
        text.write(labelValue, "Ready");
        session.place(labelValue, { parent: groupValue, before: null }, undefined);
        session.place(groupValue, { parent: session.root, before: null }, undefined);

        const snapshot = host.snapshot(root);
        assert.equal(Object.isFrozen(snapshot), true);
        assert.equal(Object.isFrozen(snapshot.children), true);
        assert.equal(snapshot.root, root);
        assert.equal(snapshot.children[0]?.id, 1);
        assert.equal(snapshot.children[0]?.primitive, Group);
        assert.deepEqual(snapshot.children[0]?.properties, [{ property: GroupGap, value: 8 }]);
        assert.equal(snapshot.children[0]?.children[0]?.id, 2);
        assert.equal(snapshot.children[0]?.children[0]?.primitive, Label);
        assert.deepEqual(snapshot.children[0]?.children[0]?.properties, [
            { property: LabelText, value: "Ready" },
        ]);

        assert.throws(() => host.open(root), /active session/i);
        session.remove(labelValue, { parent: groupValue });
        session.remove(groupValue, { parent: session.root });
        label.release(labelValue);
        group.release(groupValue);
        session.close();
        session.close();

        assert.deepEqual(host.trace(root), [
            "open",
            "resolve-primitive",
            "resolve-primitive",
            "resolve-property",
            "resolve-property",
            "create",
            "create",
            "write",
            "write",
            "place",
            "place",
            "remove",
            "remove",
            "release",
            "release",
            "close",
        ]);
        assert.throws(() => host.snapshot(root), /no active host session/i);
        assert.throws(() => group.create(), /closed/i);

        const reopened = host.open(root);
        reopened.close();
        assert.deepEqual(host.trace(root), ["open", "close"]);
    });

    test("composes with the public Renderer runtime without implementation imports", () => {
        const runtime = Runtime.create();
        const source = runtime.signal("First");
        const { host } = createHost();
        const renderer = Renderer.createRuntime(runtime, host);
        const root = { name: "renderer" };
        const definition = Template.define({
            roots: [
                Template.node(Group, {
                    properties: [Template.value(GroupGap, 4)],
                    children: [
                        Template.node(Label, {
                            properties: [Template.binding(LabelText, () => source.get())],
                        }),
                    ],
                }),
            ],
        });

        const rendered = renderer.mountTemplate(definition, { root, state: {} });
        assert.ok(rendered);
        assert.equal(host.snapshot(root).children[0]?.children[0]?.properties[0]?.value, "First");

        source.set("Second");
        assert.equal(host.snapshot(root).children[0]?.children[0]?.properties[0]?.value, "Second");

        rendered.dispose();
        assert.deepEqual(host.trace(root).slice(-5), [
            "remove",
            "remove",
            "release",
            "release",
            "close",
        ]);
        runtime.dispose();
    });
});
