import assert from "node:assert/strict";
import test from "node:test";
import { Component } from "@lilium/component";
import * as templatePackage from "@lilium/template";

const { Template } = templatePackage;

test("the package root exposes the exact frozen Template API snapshot", () => {
    assert.deepEqual(Object.keys(templatePackage), ["Template"]);
    assert.deepEqual(Object.keys(Template).sort(), [
        "binding",
        "component",
        "compose",
        "define",
        "node",
        "outlet",
        "primitive",
        "projection",
        "property",
        "slot",
        "value",
    ]);
    assert.equal(Object.isFrozen(Template), true);
    assert.throws(() => {
        Template.define = () => undefined;
    }, TypeError);
});

test("the compiled public roots compose one complete immutable template program", () => {
    let bindingEvaluations = 0;
    let outletEvaluations = 0;
    const Container = Template.primitive("Container");
    const Label = Template.primitive("Label");
    const LabelValue = Template.property(Label, "value");
    const Content = Template.slot("content");
    const behavior = Component.define({
        setup(_context, inputs) {
            return { read: () => inputs.label.get() };
        },
    });
    const childView = Template.define({
        roots: [
            Template.node(Container, {
                children: [
                    Template.node(Label, {
                        properties: [
                            Template.binding(LabelValue, ({ controller }) => {
                                bindingEvaluations += 1;
                                return controller.read();
                            }),
                        ],
                    }),
                    Template.outlet(Content, {
                        inputs: ({ inputs }) => {
                            outletEvaluations += 1;
                            return { active: inputs.label.get().length > 0 };
                        },
                        fallback: [
                            Template.node(Label, {
                                properties: [Template.value(LabelValue, "Empty")],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });
    const composition = Template.compose(behavior, childView);
    const projectedView = Template.define({
        roots: [Template.node(Label, { properties: [Template.value(LabelValue, "Projected")] })],
    });
    const projection = Template.projection(Content, projectedView);
    const component = Template.component(composition, {
        inputs: { label: "Run" },
        projections: [projection],
    });
    const parentView = Template.define({ roots: [component] });

    assert.equal(bindingEvaluations, 0);
    assert.equal(outletEvaluations, 0);
    assert.equal(Object.isFrozen(childView), true);
    assert.equal(Object.isFrozen(composition), true);
    assert.equal(Object.isFrozen(composition.slots), true);
    assert.equal(composition.slots.content, Content);
    assert.equal(Object.isFrozen(projection), true);
    assert.equal(Object.isFrozen(component), true);
    assert.equal(Object.isFrozen(parentView), true);
    assert.equal(parentView.roots[0].reference, 0);
    assert.equal(parentView.roots[0].projections[0].template, projectedView);
});

test("compiled declarations expose no execution or host capabilities", () => {
    const Primitive = Template.primitive("Primitive");
    const Slot = Template.slot();
    const outlet = Template.outlet(Slot, { inputs: () => ({}) });
    const definition = Template.define({
        roots: [Template.node(Primitive, { children: [outlet] })],
    });
    const forbiddenKeys = [
        "dispose",
        "host",
        "instance",
        "mount",
        "owner",
        "renderer",
        "runtime",
        "scope",
    ];

    for (const value of [Primitive, Slot, outlet, definition, ...definition.roots]) {
        for (const key of forbiddenKeys) {
            assert.equal(key in value, false);
        }
    }
});

test("the package exports map rejects Template implementation subpaths", async () => {
    const implementationPaths = [
        "@lilium/template/api/template.api.js",
        "@lilium/template/definition/runtime/template-definition.normalizer.js",
        "@lilium/template/slot/runtime/template-slot.registry.js",
        "@lilium/template/slot/contracts/template-slot.contract.js",
        "@lilium/template/integration",
    ];

    for (const path of implementationPaths) {
        await assert.rejects(
            import(path),
            (error) => error?.code === "ERR_PACKAGE_PATH_NOT_EXPORTED",
        );
    }
});
