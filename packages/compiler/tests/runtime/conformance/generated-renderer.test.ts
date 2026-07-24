import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Runtime } from "@lilium/core";
import { Renderer } from "@lilium/renderer";
import { RendererConsole } from "@lilium/renderer-console";
import type { TemplatedComponentDefinition } from "@lilium/template";

const generatedModuleUrl = new URL(
    "../../fixtures/golden/smallest-useful/expected.js",
    import.meta.url,
).href;
const capabilitiesModuleUrl = new URL("../../fixtures/support/ui.capabilities.js", import.meta.url)
    .href;

describe("Generated Compiler and Renderer conformance", () => {
    it("mounts and updates a generated component through the Console host", async () => {
        const [generated, capabilities] = await Promise.all([
            import(generatedModuleUrl),
            import(capabilitiesModuleUrl),
        ]);
        const definition = generated.default as TemplatedComponentDefinition<
            { initial: number },
            { increment(): void }
        >;
        const stack = RendererConsole.primitive(capabilities.Stack, {
            acceptsChildren: true,
            properties: [capabilities.StackGap],
        });
        const label = RendererConsole.primitive(capabilities.Label, {
            properties: [capabilities.LabelValue],
        });
        const action = RendererConsole.primitive(capabilities.Action, {
            properties: [capabilities.ActionLabel, capabilities.ActionActivate],
        });
        const host = RendererConsole.createHost({ primitives: [stack, label, action] });
        const runtime = Runtime.create();
        const renderer = Renderer.createRuntime(runtime, host);
        const root = { name: "generated-component" };
        const rendered = renderer.mountComponent(definition, {
            root,
            inputs: { initial: 1 },
        });

        assert.ok(rendered);
        assert.equal(
            host.snapshot(root).children[0]?.children[0]?.properties[0]?.value,
            "Count: 1",
        );
        rendered.component.controller.increment();
        assert.equal(
            host.snapshot(root).children[0]?.children[0]?.properties[0]?.value,
            "Count: 2",
        );

        rendered.dispose();
        runtime.dispose();
    });
});
