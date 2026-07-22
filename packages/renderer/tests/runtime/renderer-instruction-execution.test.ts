import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Template } from "@lilium/template";
import { RendererInstructionExecutor } from "../../src/execution/runtime/renderer-instruction.executor.js";
import { RendererSessionManager } from "../../src/session/runtime/renderer-session.manager.js";
import {
    createTestHost,
    mutationCount,
    type TestHandleType,
    type TestHostFixtureType,
} from "./renderer-host.fixture.js";

const Group = Template.primitive<{ gap: number }>("Group");
const GroupGap = Template.property<number, typeof Group>(Group, "gap");
const Label = Template.primitive<{ text: string }>("Label");
const LabelText = Template.property<string, typeof Label>(Label, "text");

function execute<State extends object>(
    fixture: TestHostFixtureType,
    definition: ReturnType<typeof Template.define<State>>,
    state: State,
) {
    const session = new RendererSessionManager(fixture.host).open({ name: "execution" });
    session.preflightTemplate(definition);
    return new RendererInstructionExecutor(session).executeTemplate(definition, state);
}

function rootChildren(fixture: TestHostFixtureType): readonly TestHandleType[] {
    const root = fixture.roots[0];
    assert.ok(root);
    const children = fixture.children.get(root);
    assert.ok(children);
    return children;
}

function writtenText(fixture: TestHostFixtureType, value: TestHandleType): unknown {
    return fixture.writes.get(value)?.get(LabelText);
}

describe("renderer static instruction execution", () => {
    test("executes an empty fragment without creating or placing host values", () => {
        const fixture = createTestHost([]);
        const definition = Template.define({ roots: [] });
        const state = {};

        const occurrence = execute(fixture, definition, state);

        assert.equal(occurrence.state, state);
        assert.equal(occurrence.rootCount, 0);
        assert.deepEqual(rootChildren(fixture), []);
        assert.equal(mutationCount(fixture.counters), 0);
        assert.deepEqual(fixture.trace, []);
    });

    test("constructs nested values detached and applies static properties before placement", () => {
        const fixture = createTestHost([
            {
                requested: Group,
                acceptsChildren: true,
                properties: [{ requested: GroupGap }],
            },
            { requested: Label, properties: [{ requested: LabelText }] },
        ]);
        const definition = Template.define({
            roots: [
                Template.node(Group, {
                    properties: [Template.value(GroupGap, 8)],
                    children: [
                        Template.node(Label, {
                            properties: [Template.value(LabelText, "First")],
                        }),
                        Template.node(Label, {
                            properties: [Template.value(LabelText, "Second")],
                        }),
                    ],
                }),
            ],
        });

        const occurrence = execute(fixture, definition, {});
        const root = rootChildren(fixture)[0];
        assert.ok(root);
        const nested = fixture.children.get(root);
        assert.ok(nested);

        assert.deepEqual(
            nested.map((value) => writtenText(fixture, value)),
            ["First", "Second"],
        );
        assert.equal(fixture.writes.get(root)?.get(GroupGap), 8);
        assert.equal(occurrence.rootCount, 1);
        assert.equal(occurrence.primitive(0).value, root);
        assert.equal(occurrence.primitive(1).value, nested[0]);
        assert.equal(occurrence.primitive(2).value, nested[1]);
        assert.deepEqual(
            fixture.trace.map(({ operation }) => operation),
            ["create", "write", "create", "write", "create", "write", "place", "place", "place"],
        );

        const rootPlacementIndex = fixture.trace.findIndex(
            (entry) => entry.operation === "place" && entry.parent === fixture.roots[0],
        );
        assert.equal(rootPlacementIndex, fixture.trace.length - 1);
        assert.equal(
            fixture.trace
                .filter((entry) => entry.operation === "place")
                .every((entry) => entry.before === null),
            true,
        );
    });

    test("preserves sibling declaration order deterministically across definitions", () => {
        const render = (labels: readonly string[]) => {
            const fixture = createTestHost([
                { requested: Label, properties: [{ requested: LabelText }] },
            ]);
            const definition = Template.define({
                roots: labels.map((label) =>
                    Template.node(Label, {
                        properties: [Template.value(LabelText, label)],
                    }),
                ),
            });

            execute(fixture, definition, {});
            return rootChildren(fixture).map((value) => writtenText(fixture, value));
        };

        assert.deepEqual(render(["First", "Second", "Third"]), ["First", "Second", "Third"]);
        assert.deepEqual(render(["Third", "First", "Second"]), ["Third", "First", "Second"]);
        assert.deepEqual(render(["First", "Second", "Third"]), ["First", "Second", "Third"]);
    });

    test("leaves dynamic bindings unevaluated for reactive integration", () => {
        const fixture = createTestHost([
            { requested: Label, properties: [{ requested: LabelText }] },
        ]);
        let evaluations = 0;
        const definition = Template.define({
            roots: [
                Template.node(Label, {
                    properties: [
                        Template.binding(LabelText, () => {
                            evaluations += 1;
                            return "Dynamic";
                        }),
                    ],
                }),
            ],
        });

        execute(fixture, definition, {});

        assert.equal(evaluations, 0);
        assert.equal(fixture.counters.write, 0);
        assert.deepEqual(
            fixture.trace.map(({ operation }) => operation),
            ["create", "place"],
        );
    });

    test("moves owned values through explicit sibling anchors", () => {
        const fixture = createTestHost([{ requested: Label }]);
        const definition = Template.define({
            roots: [Template.node(Label), Template.node(Label)],
        });
        const occurrence = execute(fixture, definition, {});
        const root = fixture.roots[0];
        assert.ok(root);
        const first = occurrence.primitive(0);
        const second = occurrence.primitive(1);

        second.place(root, first.value);
        assert.deepEqual(rootChildren(fixture), [second.value, first.value]);

        occurrence.place(root, null);
        assert.deepEqual(rootChildren(fixture), [first.value, second.value]);
        const anchoredPlacement = fixture.trace.at(-3);
        assert.equal(anchoredPlacement?.operation, "place");

        if (anchoredPlacement?.operation === "place") {
            assert.equal(anchoredPlacement.before, first.value);
        }
    });

    test("rejects execution of a different preflight identity before host mutation", () => {
        const fixture = createTestHost([{ requested: Label }]);
        const accepted = Template.define({ roots: [Template.node(Label)] });
        const different = Template.define({ roots: [Template.node(Label)] });
        const session = new RendererSessionManager(fixture.host).open({ name: "identity" });
        session.preflightTemplate(accepted);

        assert.throws(
            () => new RendererInstructionExecutor(session).executeTemplate(different, {}),
            /exact identity accepted by preflight/i,
        );
        assert.equal(mutationCount(fixture.counters), 0);
        assert.deepEqual(rootChildren(fixture), []);
    });
});
