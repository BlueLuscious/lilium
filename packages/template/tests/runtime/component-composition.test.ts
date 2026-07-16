import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { ComponentDefinition } from "@lilium/component";
import { Component } from "@lilium/component";
import type {
    ComponentTemplateStateType,
    TemplateDefinition,
    TemplatedComponentDefinition,
} from "../../src/index.js";
import { Template } from "../../src/index.js";

type ChildInputsType = {
    optional: string | undefined;
    payload: { mutable: boolean };
    value: number;
};

type ChildControllerType = {
    read(): number;
};

function createChildDefinitions(): {
    readonly behavior: ComponentDefinition<ChildInputsType, ChildControllerType>;
    readonly composition: TemplatedComponentDefinition<ChildInputsType, ChildControllerType>;
    readonly view: TemplateDefinition<
        ComponentTemplateStateType<ChildInputsType, ChildControllerType>
    >;
} {
    const behavior = Component.define<ChildInputsType, ChildControllerType>({
        setup(_context, inputs) {
            return { read: () => inputs.value.get() };
        },
    });
    const view = Template.define<ComponentTemplateStateType<ChildInputsType, ChildControllerType>>({
        roots: [],
    });
    const composition = Template.compose(behavior, view);
    return { behavior, composition, view };
}

describe("template component composition", () => {
    test("preserves independent reusable component and template identities", () => {
        const { behavior, view } = createChildDefinitions();
        const first = Template.compose(behavior, view);
        const second = Template.compose(behavior, view);

        assert.notEqual(first, second);
        assert.equal(first.component, behavior);
        assert.equal(first.template, view);
        assert.equal(second.component, behavior);
        assert.equal(second.template, view);
        assert.equal(Object.isFrozen(first), true);
        assert.equal(Object.isFrozen(first.slots), true);
        assert.deepEqual(first.slots, {});
        assert.deepEqual(Object.keys(first), ["component", "template", "slots"]);
        assert.equal("template" in behavior, false);
        assert.equal("component" in view, false);
        assert.equal("instance" in first, false);
        assert.equal("runtime" in first, false);
    });

    test("declares copied static snapshots and unevaluated dynamic snapshots", () => {
        const { composition } = createChildDefinitions();
        const retainedValue = { mutable: true };
        const snapshot: {
            optional: string | undefined;
            payload: { mutable: boolean };
            value: number;
        } = {
            optional: undefined,
            payload: retainedValue,
            value: 1,
        };
        const staticComponent = Template.component(composition, { inputs: snapshot });
        let evaluations = 0;
        const evaluate = () => {
            evaluations += 1;
            return { optional: "next", payload: retainedValue, value: 2 };
        };
        const dynamicComponent = Template.component(composition, { inputs: evaluate });

        snapshot.value = 3;
        snapshot.optional = "changed";

        assert.equal(staticComponent.inputs.kind, "value");
        assert.equal(Reflect.get(staticComponent.inputs.value, "value"), 1);
        assert.equal(Reflect.get(staticComponent.inputs.value, "optional"), undefined);
        assert.equal(Reflect.get(staticComponent.inputs.value, "payload"), retainedValue);
        assert.equal(Object.isFrozen(staticComponent.inputs.value), true);
        assert.equal(Object.isFrozen(retainedValue), false);
        assert.equal(dynamicComponent.inputs.kind, "binding");
        assert.equal(dynamicComponent.inputs.evaluate, evaluate);
        assert.equal(evaluations, 0);
        assert.equal(Object.isFrozen(staticComponent), true);
        assert.equal(Object.isFrozen(staticComponent.inputs), true);
        assert.equal(Object.isFrozen(dynamicComponent), true);
        assert.equal(Object.isFrozen(dynamicComponent.inputs), true);
        assert.equal(Object.isFrozen(dynamicComponent.projections), true);
    });

    test("normalizes nested components without entering their visual definitions", () => {
        const { composition } = createChildDefinitions();
        const Container = Template.primitive("Container");
        const dynamicInputs = () => ({
            optional: undefined,
            payload: { mutable: true },
            value: 1,
        });
        const dynamicComponent = Template.component(composition, { inputs: dynamicInputs });
        const staticComponent = Template.component(composition, {
            inputs: { optional: "child", payload: { mutable: true }, value: 2 },
        });
        const container = Template.node(Container, { children: [staticComponent] });

        const definition = Template.define({ roots: [dynamicComponent, container] });
        const normalizedDynamic = definition.roots[0];
        const normalizedContainer = definition.roots[1];
        assert.equal(normalizedDynamic.kind, "component");
        assert.equal(normalizedContainer.kind, "node");
        const normalizedStatic = normalizedContainer.children[0];
        assert.equal(normalizedStatic.kind, "component");

        assert.deepEqual(
            [
                normalizedDynamic.reference,
                normalizedContainer.reference,
                normalizedStatic.reference,
            ],
            [0, 1, 2],
        );
        assert.notEqual(normalizedDynamic, dynamicComponent);
        assert.notEqual(normalizedDynamic.inputs, dynamicComponent.inputs);
        assert.equal(normalizedDynamic.component, composition);
        assert.equal(normalizedDynamic.inputs.kind, "binding");
        assert.equal(normalizedDynamic.inputs.evaluate, dynamicInputs);
        assert.equal(normalizedStatic.inputs.kind, "value");
        assert.deepEqual(normalizedStatic.inputs.value, {
            optional: "child",
            payload: { mutable: true },
            value: 2,
        });
        assert.equal(Object.isFrozen(normalizedStatic.inputs.value), true);
    });

    test("reuses one composition across independent parent definitions", () => {
        const { composition } = createChildDefinitions();
        const firstDeclaration = Template.component(composition, {
            inputs: { optional: undefined, payload: { mutable: true }, value: 1 },
        });
        const secondDeclaration = Template.component(composition, {
            inputs: { optional: undefined, payload: { mutable: true }, value: 2 },
        });
        const firstParent = Template.define({ roots: [firstDeclaration] });
        const secondParent = Template.define({ roots: [secondDeclaration] });

        assert.notEqual(firstDeclaration, secondDeclaration);
        assert.notEqual(firstParent, secondParent);
        assert.equal(firstDeclaration.component, composition);
        assert.equal(secondDeclaration.component, composition);
        assert.equal(firstParent.roots[0].reference, 0);
        assert.equal(secondParent.roots[0].reference, 0);
        assert.equal("disposed" in composition, false);
        assert.equal("scope" in composition, false);
        assert.equal("lifecycle" in composition, false);
    });

    test("rejects foreign definitions, compositions, inputs, and premature projections", () => {
        const { behavior, composition, view } = createChildDefinitions();

        assert.throws(
            () => Template.compose({ setup: behavior.setup }, view),
            /immutable public Component definition/i,
        );
        assert.throws(
            () => Template.compose(behavior, Object.freeze({ roots: [] }) as never),
            /genuine Template definition/i,
        );
        assert.throws(
            () =>
                Template.component(
                    Object.freeze({ component: behavior, template: view, slots: {} }) as never,
                    {
                        inputs: { optional: undefined, payload: { mutable: true }, value: 1 },
                    },
                ),
            /genuine Template composition identity/i,
        );
        assert.throws(
            () => Template.component(composition, null as never),
            /component options must be a non-array object/i,
        );
        assert.throws(
            () => Template.component(composition, { inputs: null as never }),
            /component input snapshot must be a non-array object/i,
        );
        assert.throws(
            () =>
                Template.component(composition, {
                    inputs: { optional: undefined, payload: { mutable: true }, value: 1 },
                    projections: [],
                }),
            /projections are unavailable/i,
        );
    });
});
