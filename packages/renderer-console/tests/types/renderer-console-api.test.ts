import type { RendererHost } from "@lilium/renderer";
import { Template } from "@lilium/template";
import {
    type ConsoleHandleType,
    type ConsoleHost,
    type ConsolePrimitiveDefinition,
    type ConsoleRootType,
    RendererConsole,
} from "../../src/index.js";

const Group = Template.primitive<{ gap: number }>("Group");
const GroupGap = Template.property<number, typeof Group>(Group, "gap");
const Label = Template.primitive<{ text: string }>("Label");
const LabelText = Template.property<string, typeof Label>(Label, "text");

const GroupCapability = RendererConsole.primitive(Group, {
    acceptsChildren: true,
    properties: [GroupGap],
});
const LabelCapability = RendererConsole.primitive(Label, { properties: [LabelText] });
const host: ConsoleHost = RendererConsole.createHost({
    primitives: [GroupCapability, LabelCapability],
});
const rendererHost: RendererHost<ConsoleRootType, ConsoleHandleType, ConsoleHandleType> = host;
const groupDefinition: ConsolePrimitiveDefinition<typeof Group> = GroupCapability;

void rendererHost;
void groupDefinition;

RendererConsole.primitive(Group, {
    // @ts-expect-error A property capability must belong to the declared primitive.
    properties: [LabelText],
});

// @ts-expect-error Console hosts accept complete options rather than a declaration array.
RendererConsole.createHost([GroupCapability]);
