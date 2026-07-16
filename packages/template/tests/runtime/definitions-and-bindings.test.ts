import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type {
    TemplateBinding,
    TemplateNode,
    TemplatePrimitive,
    TemplateProperty,
} from "../../src/index.js";
import { Template } from "../../src/index.js";

describe("template definitions and bindings", () => {
    test("creates frozen nominal primitive and property identities", () => {
        const first = Template.primitive("  Stack  ");
        const second = Template.primitive("Stack");
        const gap = Template.property<number>(first, "  gap  ");

        assert.equal(first.name, "Stack");
        assert.equal(gap.name, "gap");
        assert.equal(gap.primitive, first);
        assert.notEqual(first, second);
        assert.equal(Object.isFrozen(first), true);
        assert.equal(Object.isFrozen(gap), true);
        assert.deepEqual(Object.keys(first), ["name"]);
        assert.deepEqual(Object.keys(gap), ["name", "primitive"]);
        assert.throws(
            () => Template.property({ name: "foreign" } as TemplatePrimitive, "value"),
            /genuine Template identity/i,
        );
        assert.throws(() => Template.primitive("   "), /non-empty string/i);
        assert.throws(() => Template.property(first, ""), /non-empty string/i);
    });

    test("copies declaration arrays without evaluating bindings or freezing application values", () => {
        const Label = Template.primitive("Label");
        const LabelValue = Template.property<{ mutable: boolean }>(Label, "value");
        const applicationValue = { mutable: true };
        let evaluations = 0;
        let equalities = 0;
        const equal = () => {
            equalities += 1;
            return false;
        };
        const staticValue = Template.value(LabelValue, applicationValue);
        const binding = Template.binding(
            LabelValue,
            () => {
                evaluations += 1;
                return applicationValue;
            },
            { equal },
        );
        const properties = [staticValue, binding];
        const children: TemplateNode<object, typeof Label, undefined>[] = [];
        const node = Template.node(Label, { properties, children });

        properties.length = 0;
        children.push(Template.node(Label));

        assert.equal(evaluations, 0);
        assert.equal(equalities, 0);
        assert.equal(binding.equal, equal);
        assert.equal(staticValue.value, applicationValue);
        assert.equal(Object.isFrozen(applicationValue), false);
        assert.equal(node.properties.length, 2);
        assert.equal(node.children.length, 0);
        assert.equal(Object.isFrozen(staticValue), true);
        assert.equal(Object.isFrozen(binding), true);
        assert.equal(Object.isFrozen(node), true);
        assert.equal(Object.isFrozen(node.properties), true);
        assert.equal(Object.isFrozen(node.children), true);
        assert.equal(binding.reference, undefined);
        assert.equal(binding.target, undefined);
        assert.equal(node.reference, undefined);
    });

    test("normalizes equivalent programs with deterministic depth-first references", () => {
        const Stack = Template.primitive("Stack");
        const StackGap = Template.property<number>(Stack, "gap");
        const Label = Template.primitive("Label");
        const LabelValue = Template.property<string>(Label, "value");
        const stackBinding = Template.binding(StackGap, () => 8);
        const labelBinding = Template.binding(LabelValue, () => "Count");
        const labelNode = Template.node(Label, { properties: [labelBinding] });
        const stackNode = Template.node(Stack, {
            properties: [Template.value(StackGap, 4), stackBinding],
            children: [labelNode],
        });

        const first = Template.define({ roots: [stackNode] });
        const second = Template.define({ roots: [stackNode] });
        const equivalent = Template.define({
            roots: [
                Template.node(Stack, {
                    properties: [Template.value(StackGap, 4), Template.binding(StackGap, () => 8)],
                    children: [
                        Template.node(Label, {
                            properties: [Template.binding(LabelValue, () => "Count")],
                        }),
                    ],
                }),
            ],
        });
        const firstRoot = first.roots[0];
        const secondRoot = second.roots[0];
        assert.equal(firstRoot.kind, "node");
        assert.equal(secondRoot.kind, "node");
        const firstBinding = firstRoot.properties[1];
        const firstChild = firstRoot.children[0];
        assert.equal(firstBinding.kind, "binding");
        assert.equal(firstChild.kind, "node");
        const childBinding = firstChild.properties[0];
        assert.equal(childBinding.kind, "binding");
        const secondBinding = secondRoot.properties[1];
        const secondChild = secondRoot.children[0];
        assert.equal(secondBinding.kind, "binding");
        assert.equal(secondChild.kind, "node");
        const secondChildBinding = secondChild.properties[0];
        assert.equal(secondChildBinding.kind, "binding");

        assert.deepEqual(
            [
                firstRoot.reference,
                firstBinding.reference,
                firstBinding.target,
                firstChild.reference,
                childBinding.reference,
                childBinding.target,
            ],
            [0, 1, 0, 2, 3, 2],
        );
        assert.deepEqual(
            [
                secondRoot.reference,
                secondBinding.reference,
                secondChild.reference,
                secondChildBinding.reference,
            ],
            [0, 1, 2, 3],
        );
        const equivalentRoot = equivalent.roots[0];
        assert.equal(equivalentRoot.kind, "node");
        const equivalentBinding = equivalentRoot.properties[1];
        const equivalentChild = equivalentRoot.children[0];
        assert.equal(equivalentBinding.kind, "binding");
        assert.equal(equivalentChild.kind, "node");
        const equivalentChildBinding = equivalentChild.properties[0];
        assert.equal(equivalentChildBinding.kind, "binding");
        assert.deepEqual(
            [
                equivalentRoot.reference,
                equivalentBinding.reference,
                equivalentChild.reference,
                equivalentChildBinding.reference,
            ],
            [0, 1, 2, 3],
        );
        assert.notEqual(first, second);
        assert.notEqual(firstRoot, stackNode);
        assert.notEqual(firstRoot.properties[0], stackNode.properties[0]);
        assert.equal(firstRoot.primitive, Stack);
        assert.equal(Object.isFrozen(first), true);
        assert.equal(Object.isFrozen(first.roots), true);
        assert.equal(Object.isFrozen(firstRoot), true);
        assert.equal(Object.isFrozen(firstRoot.properties), true);
        assert.equal(Object.isFrozen(firstRoot.children), true);
        assert.equal(stackNode.reference, undefined);
        assert.equal(stackBinding.reference, undefined);
        assert.equal(labelBinding.reference, undefined);
    });

    test("rejects malformed, foreign, mismatched, and recursive declaration shapes", () => {
        const Stack = Template.primitive("Stack");
        const Label = Template.primitive("Label");
        const StackGap = Template.property<number>(Stack, "gap");
        const LabelValue = Template.property<string>(Label, "value");

        assert.throws(
            () => Template.value({} as TemplateProperty<typeof Stack, number>, 1),
            /genuine Template identity/i,
        );
        assert.throws(
            () => Template.binding(StackGap, null as never),
            /binding evaluator must be a function/i,
        );
        assert.throws(
            () => Template.binding(StackGap, () => 1, { equal: 1 as never }),
            /equality operation must be a function/i,
        );
        assert.throws(
            () => Template.node(Stack, { properties: {} as never }),
            /properties must be an array/i,
        );
        assert.throws(
            () => Template.node(Stack, { properties: [Template.value(LabelValue, "wrong")] }),
            /belong to its primitive identity/i,
        );
        assert.throws(
            () => Template.node(Stack, { children: [{} as never] }),
            /genuine Template declarations/i,
        );
        assert.throws(() => Template.define(null as never), /non-array object/i);
        assert.throws(() => Template.define({} as never), /roots array/i);
        assert.throws(
            () => Template.define({ roots: [Template.value(StackGap, 1) as never] }),
            /genuine Template declarations/i,
        );

        const recursiveRoots: unknown[] = [];
        recursiveRoots.push(recursiveRoots);
        assert.throws(
            () => Template.define({ roots: recursiveRoots } as never),
            /genuine Template declarations/i,
        );
    });

    test("construction never evaluates dynamic work", () => {
        const Label = Template.primitive("Label");
        const LabelValue = Template.property<string>(Label, "value");
        let evaluations = 0;
        const binding: TemplateBinding<object, typeof Label, string, undefined> = Template.binding(
            LabelValue,
            () => {
                evaluations += 1;
                return "value";
            },
        );
        const node = Template.node(Label, { properties: [binding] });

        Template.define({ roots: [node] });
        Template.define({ roots: [node] });

        assert.equal(evaluations, 0);
        assert.equal(Object.isFrozen(Template), true);
        assert.deepEqual(Object.keys(Template).sort(), [
            "binding",
            "define",
            "node",
            "primitive",
            "property",
            "value",
        ]);
    });
});
