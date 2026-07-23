import type {
    RendererConformanceAdapter,
    RendererConformanceHostOptionsType,
    RendererConformanceValueSnapshotType,
} from "../../src/conformance/index.js";
import type { RendererHostOperationType } from "../../src/index.js";
import {
    createTestHost,
    type TestHandleType,
    type TestHostHooksType,
} from "./renderer-host.fixture.js";

export const rendererConformanceAdapter: RendererConformanceAdapter = {
    createHost(options: RendererConformanceHostOptionsType) {
        const occurrences = new Map<RendererHostOperationType, number>();
        const throwIfScheduled = (operation: RendererHostOperationType) => {
            const occurrence = (occurrences.get(operation) ?? 0) + 1;
            occurrences.set(operation, occurrence);
            const failure = options.failures?.find(
                (candidate) =>
                    candidate.operation === operation && (candidate.occurrence ?? 1) === occurrence,
            );

            if (failure !== undefined) {
                throw failure.error;
            }
        };
        const hooks: TestHostHooksType = {
            onOpen() {
                occurrences.clear();
                throwIfScheduled("open");
            },
            onResolvePrimitive() {
                throwIfScheduled("resolve-primitive");
            },
            onResolveProperty() {
                throwIfScheduled("resolve-property");
            },
            onCreate() {
                throwIfScheduled("create");
            },
            onWrite() {
                throwIfScheduled("write");
            },
            onPlace() {
                throwIfScheduled("place");
            },
            onRemove() {
                throwIfScheduled("remove");
            },
            onRelease() {
                throwIfScheduled("release");
            },
            onClose() {
                throwIfScheduled("close");
            },
        };
        const fixture = createTestHost(
            options.primitives
                .filter((support) => !options.omittedPrimitives?.includes(support.primitive))
                .map((support) => ({
                    requested: support.primitive,
                    acceptsChildren: support.acceptsChildren,
                    properties: support.properties
                        ?.filter((property) => !options.omittedProperties?.includes(property))
                        .map((property) => ({ requested: property })),
                })),
            hooks,
        );

        const snapshotValue = (value: TestHandleType): RendererConformanceValueSnapshotType => {
            const primitive = fixture.primitivesByValue.get(value);

            if (primitive === undefined) {
                throw new TypeError("The conformance fixture value has no primitive identity.");
            }

            return {
                primitive,
                properties: [...(fixture.writes.get(value) ?? [])].map(([property, candidate]) => ({
                    property,
                    value: candidate,
                })),
                children: (fixture.children.get(value) ?? []).map(snapshotValue),
            };
        };

        return {
            host: fixture.host,
            operations() {
                return fixture.calls.map(({ operation }) => operation);
            },
            completedOperations() {
                return fixture.trace.map(({ operation }) => operation);
            },
            snapshot() {
                const root = fixture.roots.at(-1);

                if (root === undefined) {
                    throw new Error("The conformance fixture has no opened root.");
                }

                return (fixture.children.get(root) ?? []).map(snapshotValue);
            },
        };
    },
};
