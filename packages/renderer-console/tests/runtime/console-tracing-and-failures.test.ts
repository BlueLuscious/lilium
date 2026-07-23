import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Runtime } from "@lilium/core";
import { Renderer, type RendererHostOperationType } from "@lilium/renderer";
import { Template } from "@lilium/template";
import {
    type ConsoleHost,
    type ConsoleHostOptionsType,
    type ConsoleRootType,
    RendererConsole,
} from "../../src/index.js";

const Group = Template.primitive<{ gap: number }>("Group");
const GroupGap = Template.property<number, typeof Group>(Group, "gap");
const Label = Template.primitive<{ text: string }>("Label");
const LabelText = Template.property<string, typeof Label>(Label, "text");

type ConsoleHostOverrides = Omit<ConsoleHostOptionsType, "primitives">;

function createHost(overrides: ConsoleHostOverrides = {}) {
    const group = RendererConsole.primitive(Group, {
        acceptsChildren: true,
        properties: [GroupGap],
    });
    const label = RendererConsole.primitive(Label, { properties: [LabelText] });

    return {
        group,
        label,
        host: RendererConsole.createHost({
            primitives: [group, label],
            ...overrides,
        }),
    };
}

function serializeRenderingTrace(): string {
    const runtime = Runtime.create();
    const value = runtime.signal("First");
    const { host } = createHost();
    const renderer = Renderer.createRuntime(runtime, host);
    const root = { name: "deterministic" };
    const definition = Template.define({
        roots: [
            Template.node(Group, {
                properties: [Template.value(GroupGap, 8)],
                children: [
                    Template.node(Label, {
                        properties: [Template.binding(LabelText, () => value.get())],
                    }),
                ],
            }),
        ],
    });
    const rendered = renderer.mountTemplate(definition, { root, state: {} });

    assert.ok(rendered);
    value.set("Second");
    rendered.dispose();
    runtime.dispose();
    return JSON.stringify(host.trace(root));
}

function triggerFailure(
    operation: RendererHostOperationType,
    host: ConsoleHost,
    root: ConsoleRootType,
): void {
    if (operation === "open") {
        host.open(root);
        return;
    }

    const session = host.open(root);

    if (operation === "close") {
        session.close();
        return;
    }

    if (operation === "resolve-primitive") {
        session.resolvePrimitive(Label);
        return;
    }

    const primitive = session.resolvePrimitive(Label);
    assert.ok(primitive);

    if (operation === "resolve-property") {
        primitive.resolveProperty(LabelText);
        return;
    }

    if (operation === "create") {
        primitive.create();
        return;
    }

    const value = primitive.create();

    if (operation === "release") {
        primitive.release(value);
        return;
    }

    if (operation === "place") {
        session.place(value, { parent: session.root, before: null }, undefined);
        return;
    }

    const property = primitive.resolveProperty(LabelText);
    assert.ok(property);

    if (operation === "write") {
        property.write(value, "candidate");
        return;
    }

    session.place(value, { parent: session.root, before: null }, undefined);

    if (operation === "remove") {
        session.remove(value, { parent: session.root });
        return;
    }

    primitive.release(value);
    session.close();
}

describe("Renderer Console deterministic tracing", () => {
    test("produces byte-equivalent traces without external or candidate identities", () => {
        const first = serializeRenderingTrace();
        const second = serializeRenderingTrace();
        const trace = JSON.parse(first) as readonly Record<string, unknown>[];

        assert.equal(first, second);
        assert.deepEqual(
            trace.map((entry) => entry.sequence),
            trace.map((_, sequence) => sequence),
        );
        assert.equal(first.includes("First"), false);
        assert.equal(first.includes("Second"), false);
        assert.equal(first.includes("deterministic"), false);
    });

    test("returns immutable structured snapshots with normalized logical identities", () => {
        const { host } = createHost();
        const root = { name: "identities" };
        const session = host.open(root);
        const group = session.resolvePrimitive(Group);
        const label = session.resolvePrimitive(Label);
        assert.ok(group);
        assert.ok(label);
        const gap = group.resolveProperty(GroupGap);
        assert.ok(gap);
        const groupValue = group.create();
        const labelValue = label.create();

        gap.write(groupValue, 4);
        session.place(labelValue, { parent: groupValue, before: null }, undefined);
        session.place(groupValue, { parent: session.root, before: null }, undefined);

        const trace = host.trace(root);
        assert.equal(Object.isFrozen(trace), true);
        assert.equal(
            trace.every((entry) => Object.isFrozen(entry)),
            true,
        );
        assert.deepEqual(trace[0], {
            sequence: 0,
            status: "attempted",
            operation: "open",
            root: 0,
        });
        assert.deepEqual(
            trace.filter(
                ({ operation, status }) => operation === "create" && status === "completed",
            ),
            [
                { sequence: 9, status: "completed", operation: "create", primitive: 0, value: 1 },
                { sequence: 11, status: "completed", operation: "create", primitive: 1, value: 2 },
            ],
        );
        assert.deepEqual(trace.at(-1), {
            sequence: 17,
            status: "completed",
            operation: "place",
            value: 1,
            parent: 0,
            before: null,
            currentParent: null,
        });

        session.remove(groupValue, { parent: session.root });
        session.remove(labelValue, { parent: groupValue });
        label.release(labelValue);
        group.release(groupValue);
        session.close();
    });
});

describe("Renderer Console capability omissions", () => {
    test("reports an omitted primitive through public Renderer preflight", () => {
        const runtime = Runtime.create();
        const { host } = createHost({ omittedPrimitives: [Label] });
        const renderer = Renderer.createRuntime(runtime, host);
        const root = { name: "omitted-primitive" };
        const definition = Template.define({ roots: [Template.node(Label)] });

        assert.throws(
            () => renderer.mountTemplate(definition, { root, state: {} }),
            /missing-primitive/i,
        );
        assert.deepEqual(
            host.trace(root).map(({ operation, status }) => `${operation}:${status}`),
            [
                "open:attempted",
                "open:completed",
                "resolve-primitive:attempted",
                "resolve-primitive:completed",
                "close:attempted",
                "close:completed",
            ],
        );
        runtime.dispose();
    });

    test("reports an omitted property without constructing a host value", () => {
        const runtime = Runtime.create();
        const { host } = createHost({ omittedProperties: [LabelText] });
        const renderer = Renderer.createRuntime(runtime, host);
        const root = { name: "omitted-property" };
        const definition = Template.define({
            roots: [
                Template.node(Label, {
                    properties: [Template.value(LabelText, "Unsupported")],
                }),
            ],
        });

        assert.throws(
            () => renderer.mountTemplate(definition, { root, state: {} }),
            /missing-property/i,
        );
        assert.equal(
            host.trace(root).some(({ operation }) => operation === "create"),
            false,
        );
        runtime.dispose();
    });

    test("rejects duplicate and unconfigured omissions", () => {
        const group = RendererConsole.primitive(Group);
        const label = RendererConsole.primitive(Label, { properties: [LabelText] });

        assert.throws(
            () =>
                RendererConsole.createHost({
                    primitives: [group, label],
                    omittedPrimitives: [Label, Label],
                }),
            /more than once/i,
        );
        assert.throws(
            () =>
                RendererConsole.createHost({
                    primitives: [group],
                    omittedProperties: [LabelText],
                }),
            /unconfigured property/i,
        );
    });
});

describe("Renderer Console failure injection", () => {
    const operations: readonly RendererHostOperationType[] = [
        "open",
        "resolve-primitive",
        "resolve-property",
        "create",
        "write",
        "place",
        "remove",
        "release",
        "close",
    ];

    for (const operation of operations) {
        test(`records an incomplete ${operation} attempt and throws the exact error`, () => {
            const failure = new Error(`injected ${operation} failure`);
            const { host } = createHost({ failures: [{ operation, error: failure }] });
            const root = { name: operation };

            assert.throws(
                () => triggerFailure(operation, host, root),
                (error) => error === failure,
            );
            assert.deepEqual(
                host
                    .trace(root)
                    .filter((entry) => entry.operation === operation)
                    .map(({ status }) => status),
                ["attempted"],
            );
        });
    }

    test("targets a one-based occurrence without changing earlier state", () => {
        const failure = new Error("second write failed");
        const { host } = createHost({
            failures: [{ operation: "write", occurrence: 2, error: failure }],
        });
        const root = { name: "occurrence" };
        const session = host.open(root);
        const primitive = session.resolvePrimitive(Label);
        assert.ok(primitive);
        const property = primitive.resolveProperty(LabelText);
        assert.ok(property);
        const value = primitive.create();

        property.write(value, "first");
        assert.throws(
            () => property.write(value, "second"),
            (error) => error === failure,
        );
        assert.deepEqual(
            host
                .trace(root)
                .filter(({ operation }) => operation === "write")
                .map(({ status }) => status),
            ["attempted", "completed", "attempted"],
        );
        assert.deepEqual(host.snapshot(root).children, []);

        primitive.release(value);
        session.close();
    });

    test("terminalizes release before propagating its injected failure", () => {
        const failure = new Error("release failed");
        const { host } = createHost({
            failures: [{ operation: "release", error: failure }],
        });
        const root = { name: "release-terminal" };
        const session = host.open(root);
        const primitive = session.resolvePrimitive(Label);
        assert.ok(primitive);
        const value = primitive.create();

        assert.throws(
            () => primitive.release(value),
            (error) => error === failure,
        );
        assert.throws(() => primitive.release(value), /released/i);
        assert.doesNotThrow(() => session.close());
        assert.throws(() => host.snapshot(root), /no active host session/i);
    });

    test("terminalizes close and releases its root claim before propagating failure", () => {
        const failure = new Error("close failed");
        const { host } = createHost({
            failures: [{ operation: "close", error: failure }],
        });
        const root = { name: "close-terminal" };
        const session = host.open(root);

        assert.throws(
            () => session.close(),
            (error) => error === failure,
        );
        assert.doesNotThrow(() => session.close());
        assert.throws(() => host.snapshot(root), /no active host session/i);

        const reopened = host.open(root);
        assert.throws(
            () => reopened.close(),
            (error) => error === failure,
        );
    });

    test("validates the complete failure plan before opening a session", () => {
        const { group, label } = createHost();

        assert.throws(
            () =>
                RendererConsole.createHost({
                    primitives: [group, label],
                    failures: [
                        { operation: "write", error: "first" },
                        { operation: "write", occurrence: 1, error: "duplicate" },
                    ],
                }),
            /cannot inject multiple failures/i,
        );
        assert.throws(
            () =>
                RendererConsole.createHost({
                    primitives: [group, label],
                    failures: [{ operation: "write", occurrence: 0, error: "invalid" }],
                }),
            /positive safe integer/i,
        );
    });
});
