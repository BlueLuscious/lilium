import { Template } from "@lilium/template";

export const Stack = Template.primitive("Stack");
export const Label = Template.primitive("Label");
export const Action = Template.primitive("Action");

/** @type {import("@lilium/template").TemplateProperty<typeof Stack, number>} */
export const StackGap = Template.property(Stack, "gap");

/** @type {import("@lilium/template").TemplateProperty<typeof Stack, object>} */
export const StackConfig = Template.property(Stack, "config");

/** @type {import("@lilium/template").TemplateProperty<typeof Label, string>} */
export const LabelValue = Template.property(Label, "value");

/** @type {import("@lilium/template").TemplateProperty<typeof Action, string>} */
export const ActionLabel = Template.property(Action, "label");

/** @type {import("@lilium/template").TemplateProperty<typeof Action, () => void>} */
export const ActionActivate = Template.property(Action, "activate");
