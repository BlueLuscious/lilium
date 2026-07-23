import type {
    RendererConformanceAdapter,
    RendererConformanceHostOptionsType,
    RendererConformanceValueSnapshotType,
} from "@lilium/renderer/conformance";
import type { TemplateProperty } from "@lilium/template";
import { RendererConsole } from "../../src/index.js";

export const rendererConsoleConformanceAdapter: RendererConformanceAdapter = {
    createHost(options: RendererConformanceHostOptionsType) {
        const primitives = options.primitives.map((support) =>
            RendererConsole.primitive(support.primitive, {
                acceptsChildren: support.acceptsChildren,
                properties: support.properties,
            }),
        );
        const host = RendererConsole.createHost({
            primitives,
            omittedPrimitives: options.omittedPrimitives,
            omittedProperties: options.omittedProperties,
            failures: options.failures,
        });

        const normalizeValue = (
            value: ReturnType<typeof host.snapshot>["children"][number],
        ): RendererConformanceValueSnapshotType => ({
            primitive: value.primitive,
            properties: value.properties.map(({ property, value }) => ({
                property: property as TemplateProperty,
                value,
            })),
            children: value.children.map(normalizeValue),
        });

        return {
            host,
            operations(root) {
                return host
                    .trace(root)
                    .filter(({ status }) => status === "attempted")
                    .map(({ operation }) => operation);
            },
            completedOperations(root) {
                return host
                    .trace(root)
                    .filter(({ status }) => status === "completed")
                    .map(({ operation }) => operation);
            },
            snapshot(root) {
                return host.snapshot(root).children.map(normalizeValue);
            },
        };
    },
};
