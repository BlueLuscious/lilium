import type { RendererHost } from "@lilium/renderer";
import { Template } from "@lilium/template";
import {
    type ConsoleFailureInjectionType,
    type ConsoleHandleType,
    type ConsoleHost,
    type ConsolePrimitiveDefinition,
    type ConsoleRootType,
    type ConsoleTraceEntryType,
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
    omittedPrimitives: [Label],
    omittedProperties: [GroupGap],
    failures: [{ operation: "write", occurrence: 2, error: new Error("expected") }],
});
const rendererHost: RendererHost<ConsoleRootType, ConsoleHandleType, ConsoleHandleType> = host;
const groupDefinition: ConsolePrimitiveDefinition<typeof Group> = GroupCapability;
const trace: readonly ConsoleTraceEntryType[] = host.trace({ name: "trace" });
const failure: ConsoleFailureInjectionType = {
    operation: "place",
    error: new Error("expected"),
};

void rendererHost;
void groupDefinition;
void trace;
void failure;

RendererConsole.primitive(Group, {
    // @ts-expect-error A property capability must belong to the declared primitive.
    properties: [LabelText],
});

// @ts-expect-error Console hosts accept complete options rather than a declaration array.
RendererConsole.createHost([GroupCapability]);

const invalidFailure: ConsoleFailureInjectionType = {
    // @ts-expect-error Failure operations must belong to the public Renderer protocol vocabulary.
    operation: "snapshot",
    error: new Error("invalid"),
};

void invalidFailure;
