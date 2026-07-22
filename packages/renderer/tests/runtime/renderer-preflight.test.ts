import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Component } from "@lilium/component";
import {
    type ComponentTemplateStateType,
    Template,
    type TemplateProjectionStateType,
} from "@lilium/template";
import { RendererSessionManager } from "../../src/session/runtime/renderer-session.manager.js";
import { createTestHost, mutationCount } from "./renderer-host.fixture.js";

const Container = Template.primitive("Container");
const Label = Template.primitive<{ text: string }>("Label");
const LabelText = Template.property<string, typeof Label>(Label, "text");

function createRepeatedDefinition() {
    return Template.define({
        roots: [
            Template.node(Container, {
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
}

describe("renderer capability preflight", () => {
    test("accepts a complete host and resolves duplicate requirements once", () => {
        const fixture = createTestHost([
            { requested: Container, acceptsChildren: true },
            { requested: Label, properties: [{ requested: LabelText }] },
        ]);
        const session = new RendererSessionManager(fixture.host).open({ name: "main" });

        session.preflightTemplate(createRepeatedDefinition());

        assert.equal(fixture.counters.primitiveResolutions.get(Container), 1);
        assert.equal(fixture.counters.primitiveResolutions.get(Label), 1);
        assert.equal(fixture.counters.propertyResolutions.get(LabelText), 1);
        assert.equal(session.capabilities.primitive(Container), fixture.primitives.get(Container));
        assert.equal(session.capabilities.property(LabelText), fixture.properties.get(LabelText));
        assert.equal(mutationCount(fixture.counters), 0);
        session.close();
    });

    test("collects a selected projection without requiring its inactive fallback", () => {
        const Content = Template.slot("content");
        const Fallback = Template.primitive("Fallback");
        const Projected = Template.primitive("Projected");
        const behavior = Component.define<object, object>({
            setup() {
                return {};
            },
        });
        const childTemplate = Template.define<ComponentTemplateStateType<object, object>>({
            roots: [
                Template.outlet(Content, {
                    inputs: () => ({}),
                    fallback: [Template.node(Fallback)],
                }),
            ],
        });
        const child = Template.compose(behavior, childTemplate);
        const projectedTemplate = Template.define<TemplateProjectionStateType<object, object>>({
            roots: [Template.node(Projected)],
        });
        const projection = Template.projection(Content, projectedTemplate);
        const definition = Template.define({
            roots: [Template.component(child, { inputs: {}, projections: [projection] })],
        });
        const fixture = createTestHost([{ requested: Projected }]);
        const session = new RendererSessionManager(fixture.host).open({ name: "projection" });

        session.preflightTemplate(definition);

        assert.equal(fixture.counters.primitiveResolutions.get(Projected), 1);
        assert.equal(fixture.counters.primitiveResolutions.has(Fallback), false);
        assert.equal(mutationCount(fixture.counters), 0);
        session.close();
    });

    test("reports a missing primitive and closes before any host mutation", () => {
        const fixture = createTestHost([]);
        const session = new RendererSessionManager(fixture.host).open({ name: "main" });

        assert.throws(
            () => session.preflightTemplate(Template.define({ roots: [Template.node(Label)] })),
            (error: unknown) =>
                error instanceof Error &&
                error.name === "RendererCompatibilityError" &&
                "issue" in error &&
                error.issue === "missing-primitive" &&
                "subject" in error &&
                error.subject === Label,
        );
        assert.equal(session.closed, true);
        assert.equal(fixture.counters.close, 1);
        assert.equal(mutationCount(fixture.counters), 0);
    });

    test("reports a missing property and closes before any host mutation", () => {
        const fixture = createTestHost([{ requested: Label }]);
        const definition = Template.define({
            roots: [Template.node(Label, { properties: [Template.value(LabelText, "Missing")] })],
        });
        const session = new RendererSessionManager(fixture.host).open({ name: "main" });

        assert.throws(
            () => session.preflightTemplate(definition),
            (error: unknown) =>
                error instanceof Error &&
                error.name === "RendererCompatibilityError" &&
                "issue" in error &&
                error.issue === "missing-property" &&
                "subject" in error &&
                error.subject === LabelText,
        );
        assert.equal(session.closed, true);
        assert.equal(mutationCount(fixture.counters), 0);
    });

    test("rejects children on an incompatible primitive before mutation", () => {
        const fixture = createTestHost([
            { requested: Container, acceptsChildren: false },
            { requested: Label },
        ]);
        const definition = Template.define({
            roots: [Template.node(Container, { children: [Template.node(Label)] })],
        });
        const session = new RendererSessionManager(fixture.host).open({ name: "main" });

        assert.throws(
            () => session.preflightTemplate(definition),
            (error: unknown) =>
                error instanceof Error &&
                error.name === "RendererCompatibilityError" &&
                "issue" in error &&
                error.issue === "children-unsupported" &&
                "subject" in error &&
                error.subject === Container,
        );
        assert.equal(session.closed, true);
        assert.equal(mutationCount(fixture.counters), 0);
    });

    test("rejects mismatched primitive and property identities", async (context) => {
        await context.test("primitive identity", () => {
            const Other = Template.primitive("Other");
            const fixture = createTestHost([{ requested: Label, provided: Other }]);
            const session = new RendererSessionManager(fixture.host).open({ name: "primitive" });

            assert.throws(
                () => session.preflightTemplate(Template.define({ roots: [Template.node(Label)] })),
                (error: unknown) =>
                    error instanceof Error &&
                    "issue" in error &&
                    error.issue === "primitive-mismatch",
            );
            assert.equal(mutationCount(fixture.counters), 0);
        });

        await context.test("property identity", () => {
            const OtherText = Template.property<string, typeof Label>(Label, "other-text");
            const fixture = createTestHost([
                {
                    requested: Label,
                    properties: [{ requested: LabelText, provided: OtherText }],
                },
            ]);
            const definition = Template.define({
                roots: [Template.node(Label, { properties: [Template.value(LabelText, "Text")] })],
            });
            const session = new RendererSessionManager(fixture.host).open({ name: "property" });

            assert.throws(
                () => session.preflightTemplate(definition),
                (error: unknown) =>
                    error instanceof Error &&
                    "issue" in error &&
                    error.issue === "property-mismatch",
            );
            assert.equal(mutationCount(fixture.counters), 0);
        });
    });
});
