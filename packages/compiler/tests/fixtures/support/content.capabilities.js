import { Template } from "@lilium/template";

export const Heading = Template.primitive("Heading");
export const Button = Template.primitive("Button");

/** @type {import("@lilium/template").TemplateProperty<typeof Heading, string>} */
export const HeadingText = Template.property(Heading, "text");

/** @type {import("@lilium/template").TemplateProperty<typeof Button, string>} */
export const ButtonLabel = Template.property(Button, "label");
