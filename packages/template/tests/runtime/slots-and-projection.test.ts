import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Component } from "@lilium/component";
import type {
    ComponentTemplateStateType,
    TemplateDefinition,
    TemplatedComponentDefinition,
    TemplateProjectionStateType,
} from "../../src/index.js";
import { Template } from "../../src/index.js";

type ChildInputsType = {
    label: string;
};

type ChildControllerType = {
    activate(): void;
};

type ContentInputsType = {
    active: boolean;
};

type ParentStateType = {
    title: string;
};

function createSlottedComposition(): {
    readonly composition: TemplatedComponentDefinition<ChildInputsType, ChildControllerType>;
    readonly content: ReturnType<typeof Template.slot<ContentInputsType>>;
    readonly defaultSlot: ReturnType<typeof Template.slot>;
    readonly view: TemplateDefinition<
        ComponentTemplateStateType<ChildInputsType, ChildControllerType>
    >;
} {
    const behavior = Component.define<ChildInputsType, ChildControllerType>({
        setup() {
            return { activate() {} };
        },
    });
    const Container = Template.primitive("Container");
    const defaultSlot = Template.slot();
    const content = Template.slot<ContentInputsType>("content");
    const defaultOutlet = Template.outlet(defaultSlot, {
        inputs: () => ({}),
        fallback: [Template.node(Container)],
    });
    const contentOutlet = Template.outlet<
        ComponentTemplateStateType<ChildInputsType, ChildControllerType>,
        ContentInputsType
    >(content, {
        inputs: ({ inputs }) => ({ active: inputs.label.get().length > 0 }),
    });
    const view = Template.define<ComponentTemplateStateType<ChildInputsType, ChildControllerType>>({
        roots: [
            Template.node(Container, {
                children: [defaultOutlet, Template.node(Container, { children: [contentOutlet] })],
            }),
        ],
    });
    return {
        composition: Template.compose(behavior, view),
        content,
        defaultSlot,
        view,
    };
}

describe("template slots and projection", () => {
    test("creates nominal named and canonical default slot identities", () => {
        const firstDefault = Template.slot();
        const secondDefault = Template.slot();
        const named = Template.slot("  content  ");

        assert.equal(firstDefault.name, "default");
        assert.equal(secondDefault.name, "default");
        assert.notEqual(firstDefault, secondDefault);
        assert.equal(named.name, "content");
        assert.equal(Object.isFrozen(firstDefault), true);
        assert.equal(Object.isFrozen(named), true);
        assert.throws(() => Template.slot(""), /non-empty string/i);
        assert.throws(() => Template.slot(1 as never), /non-empty string/i);
    });

    test("normalizes nested outlets and fallback declarations in deterministic order", () => {
        const { composition, content, defaultSlot, view } = createSlottedComposition();
        const root = view.roots[0];
        assert.equal(root.kind, "node");
        const defaultOutlet = root.children[0];
        const nestedContainer = root.children[1];
        assert.equal(defaultOutlet.kind, "outlet");
        assert.equal(nestedContainer.kind, "node");
        const fallback = defaultOutlet.fallback[0];
        const contentOutlet = nestedContainer.children[0];
        assert.equal(fallback.kind, "node");
        assert.equal(contentOutlet.kind, "outlet");

        assert.deepEqual(
            [
                root.reference,
                defaultOutlet.reference,
                fallback.reference,
                nestedContainer.reference,
                contentOutlet.reference,
            ],
            [0, 1, 2, 3, 4],
        );
        assert.equal(defaultOutlet.slot, defaultSlot);
        assert.equal(contentOutlet.slot, content);
        assert.equal(Object.isFrozen(defaultOutlet), true);
        assert.equal(Object.isFrozen(defaultOutlet.fallback), true);
        assert.deepEqual(Object.keys(composition.slots), ["default", "content"]);
        assert.equal(composition.slots.default, defaultSlot);
        assert.equal(composition.slots.content, content);
        assert.equal(Object.isFrozen(composition.slots), true);
    });

    test("copies ordered projections while preserving independent template identities", () => {
        const { composition, content, defaultSlot } = createSlottedComposition();
        const DefaultProjection = Template.define<
            TemplateProjectionStateType<ParentStateType, object>
        >({ roots: [] });
        const ContentProjection = Template.define<
            TemplateProjectionStateType<ParentStateType, ContentInputsType>
        >({ roots: [] });
        const contentProjection = Template.projection(content, ContentProjection);
        const defaultProjection = Template.projection(defaultSlot, DefaultProjection);
        const candidates = [contentProjection, defaultProjection];
        const declaration = Template.component(composition, {
            inputs: { label: "Run" },
            projections: candidates,
        });

        candidates.reverse();

        assert.deepEqual(
            declaration.projections.map(({ slot }) => slot),
            [content, defaultSlot],
        );
        assert.equal(declaration.projections[0].template, ContentProjection);
        assert.equal(declaration.projections[1].template, DefaultProjection);
        assert.notEqual(declaration.projections[0], candidates[1]);
        assert.equal(Object.isFrozen(declaration.projections), true);
        assert.equal(Object.isFrozen(declaration.projections[0]), true);

        const parent = Template.define<ParentStateType>({ roots: [declaration] });
        const normalized = parent.roots[0];
        assert.equal(normalized.kind, "component");
        assert.notEqual(normalized.projections, declaration.projections);
        assert.notEqual(normalized.projections[0], declaration.projections[0]);
        assert.equal(normalized.projections[0].template, ContentProjection);
        assert.equal(normalized.projections[1].template, DefaultProjection);
    });

    test("accepts omitted projections without mutating child fallback declarations", () => {
        const { composition, view } = createSlottedComposition();
        const declaration = Template.component(composition, { inputs: { label: "Run" } });
        const root = view.roots[0];
        assert.equal(root.kind, "node");
        const outlet = root.children[0];
        assert.equal(outlet.kind, "outlet");

        assert.deepEqual(declaration.projections, []);
        assert.equal(outlet.fallback.length, 1);
        assert.equal(Object.isFrozen(declaration.projections), true);
    });

    test("rejects duplicate outlet identities and duplicate slot names", () => {
        const duplicate = Template.slot("duplicate");
        const first = Template.outlet(duplicate, { inputs: () => ({}) });
        const second = Template.outlet(duplicate, { inputs: () => ({}) });
        assert.throws(
            () => Template.define({ roots: [first, second] }),
            /duplicate outlet "duplicate"/i,
        );

        const firstNamed = Template.slot("same");
        const secondNamed = Template.slot("same");
        assert.throws(
            () =>
                Template.define({
                    roots: [
                        Template.outlet(firstNamed, { inputs: () => ({}) }),
                        Template.outlet(secondNamed, { inputs: () => ({}) }),
                    ],
                }),
            /duplicate slot name "same"/i,
        );
    });

    test("rejects unknown, duplicate, foreign, and malformed projection declarations", () => {
        const { composition, content } = createSlottedComposition();
        const projection = Template.define<
            TemplateProjectionStateType<ParentStateType, ContentInputsType>
        >({ roots: [] });
        const sameName = Template.slot<ContentInputsType>("content");
        const unknownProjection = Template.projection(sameName, projection);
        const contentProjection = Template.projection(content, projection);

        assert.throws(
            () =>
                Template.component(composition, {
                    inputs: { label: "Run" },
                    projections: [unknownProjection],
                }),
            /unknown slot "content"/i,
        );
        assert.throws(
            () =>
                Template.component(composition, {
                    inputs: { label: "Run" },
                    projections: [contentProjection, contentProjection],
                }),
            /duplicate slot "content"/i,
        );
        assert.throws(
            () => Template.projection(content, Object.freeze({ roots: [] }) as never),
            /genuine Template definition/i,
        );
        assert.throws(
            () =>
                Template.component(composition, {
                    inputs: { label: "Run" },
                    projections: {} as never,
                }),
            /projections must be an array/i,
        );
        assert.throws(
            () =>
                Template.component(composition, {
                    inputs: { label: "Run" },
                    projections: [Object.freeze({ slot: content, template: projection }) as never],
                }),
            /genuine Template declaration/i,
        );
    });

    test("rejects foreign slots and malformed outlet declarations without evaluation", () => {
        const slot = Template.slot<{ active: boolean }>("content");
        let evaluations = 0;
        const outlet = Template.outlet(slot, {
            inputs: () => {
                evaluations += 1;
                return { active: true };
            },
        });
        Template.define({ roots: [outlet] });

        assert.equal(evaluations, 0);
        assert.throws(
            () =>
                Template.outlet(Object.freeze({ name: "content" }) as never, {
                    inputs: () => ({}),
                }),
            /genuine Template identity/i,
        );
        assert.throws(
            () => Template.outlet(slot, null as never),
            /outlet options must be a non-array object/i,
        );
        assert.throws(
            () => Template.outlet(slot, { inputs: null as never }),
            /input evaluator must be a function/i,
        );
        assert.throws(
            () =>
                Template.outlet(slot, { inputs: () => ({ active: true }), fallback: {} as never }),
            /outlet fallback must be an array/i,
        );
    });
});
