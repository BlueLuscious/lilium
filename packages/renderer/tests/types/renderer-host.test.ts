import { Template } from "@lilium/template";
import type {
    RendererAttachmentType,
    RendererCompatibilityError,
    RendererHost,
    RendererHostSession,
    RendererPlacementType,
    RendererPrimitiveCapability,
    RendererPropertyCapability,
    RendererProtocolError,
} from "../../src/index.js";

type RootType = {
    readonly id: "root";
};

type ParentHandleType = {
    readonly id: number;
};

type ValueHandleType = ParentHandleType & {
    readonly value: true;
};

const Group = Template.primitive<{ gap: number }>("Group");
const GroupGap = Template.property<number, typeof Group>(Group, "gap");
const Label = Template.primitive<{ text: string }>("Label");
const LabelText = Template.property<string, typeof Label>(Label, "text");

declare const groupCapability: RendererPrimitiveCapability<
    ParentHandleType,
    ValueHandleType,
    typeof Group
>;
declare const groupValue: ValueHandleType;
declare const host: RendererHost<RootType, ParentHandleType, ValueHandleType>;
declare const parent: ParentHandleType;
declare const session: RendererHostSession<ParentHandleType, ValueHandleType>;

const attachment: RendererAttachmentType<ParentHandleType> = { parent };
const placement: RendererPlacementType<ParentHandleType, ValueHandleType> = {
    before: null,
    parent,
};
const propertyCapability:
    | RendererPropertyCapability<ValueHandleType, typeof Group, number>
    | undefined = groupCapability.resolveProperty(GroupGap);
const resolvedGroup:
    | RendererPrimitiveCapability<ParentHandleType, ValueHandleType, typeof Group>
    | undefined = session.resolvePrimitive(Group);

session.place(groupValue, placement, undefined);
session.remove(groupValue, attachment);
groupCapability.release(groupValue);

if (propertyCapability !== undefined) {
    propertyCapability.write(groupValue, 8);

    // @ts-expect-error Property capability values preserve the Template property value type.
    propertyCapability.write(groupValue, "8");
}

// @ts-expect-error A primitive capability resolves only properties owned by its primitive.
groupCapability.resolveProperty(LabelText);

// @ts-expect-error Value handles must also satisfy their configured parent handle type.
declare const invalidHost: RendererHost<RootType, ParentHandleType, { readonly foreign: true }>;

declare const compatibilityError: RendererCompatibilityError;
declare const protocolError: RendererProtocolError;

const compatibilityName: "RendererCompatibilityError" = compatibilityError.name;
const protocolName: "RendererProtocolError" = protocolError.name;

void compatibilityName;
void host;
void invalidHost;
void Label;
void protocolName;
void resolvedGroup;
