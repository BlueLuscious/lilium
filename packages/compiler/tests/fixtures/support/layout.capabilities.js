import { Template } from "@lilium/template";

export const Panel = Template.primitive("Panel");

/** @type {import("@lilium/template").TemplateProperty<typeof Panel, number>} */
export const PanelGap = Template.property(Panel, "gap");
