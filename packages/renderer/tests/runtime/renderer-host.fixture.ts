import type { TemplatePrimitive, TemplateProperty } from "@lilium/template";
import type { RendererHost } from "../../src/host/contracts/renderer-host.contract.js";
import type { RendererPrimitiveCapability } from "../../src/host/contracts/renderer-primitive-capability.contract.js";
import type { RendererPropertyCapability } from "../../src/host/contracts/renderer-property-capability.contract.js";

export type TestRootType = {
    readonly name: string;
};

export type TestHandleType = {
    readonly id: number;
};

export type TestPropertySupportType = {
    readonly requested: TemplateProperty;
    readonly provided?: TemplateProperty;
    readonly onWrite?: (value: TestHandleType, candidate: unknown) => void;
};

export type TestPrimitiveSupportType = {
    readonly requested: TemplatePrimitive<object>;
    readonly provided?: TemplatePrimitive<object>;
    readonly acceptsChildren?: boolean;
    readonly properties?: readonly TestPropertySupportType[];
};

export type TestHostHooksType = {
    readonly onClose?: () => void;
    readonly onCreate?: (primitive: TemplatePrimitive<object>) => void;
    readonly onOpen?: (root: TestRootType) => void;
    readonly onPlace?: (
        value: TestHandleType,
        parent: TestHandleType,
        before: TestHandleType | null,
    ) => void;
    readonly onRelease?: (value: TestHandleType) => void;
    readonly onRemove?: (value: TestHandleType, parent: TestHandleType) => void;
    readonly onResolvePrimitive?: (primitive: TemplatePrimitive<object>) => void;
    readonly onResolveProperty?: (
        primitive: TemplatePrimitive<object>,
        property: TemplateProperty,
    ) => void;
    readonly onWrite?: (
        value: TestHandleType,
        property: TemplateProperty,
        candidate: unknown,
    ) => void;
};

export type TestHostCountersType = {
    open: number;
    close: number;
    create: number;
    write: number;
    place: number;
    remove: number;
    release: number;
    readonly primitiveResolutions: Map<TemplatePrimitive<object>, number>;
    readonly propertyResolutions: Map<TemplateProperty, number>;
};

export type TestHostTraceEntryType =
    | Readonly<{
          operation: "create";
          primitive: TemplatePrimitive<object>;
          value: TestHandleType;
      }>
    | Readonly<{
          operation: "write";
          property: TemplateProperty;
          value: TestHandleType;
          candidate: unknown;
      }>
    | Readonly<{
          operation: "place";
          value: TestHandleType;
          parent: TestHandleType;
          before: TestHandleType | null;
      }>
    | Readonly<{
          operation: "remove";
          value: TestHandleType;
          parent: TestHandleType;
      }>
    | Readonly<{
          operation: "release";
          value: TestHandleType;
      }>
    | Readonly<{
          operation: "close";
      }>;

export type TestHostCallType =
    | Readonly<{
          operation: "open";
          root: TestRootType;
      }>
    | Readonly<{
          operation: "resolve-primitive";
          primitive: TemplatePrimitive<object>;
      }>
    | Readonly<{
          operation: "resolve-property";
          primitive: TemplatePrimitive<object>;
          property: TemplateProperty;
      }>
    | Readonly<{
          operation: "create";
          primitive: TemplatePrimitive<object>;
      }>
    | Readonly<{
          operation: "write";
          property: TemplateProperty;
          value: TestHandleType;
          candidate: unknown;
      }>
    | Readonly<{
          operation: "place";
          value: TestHandleType;
          parent: TestHandleType;
          before: TestHandleType | null;
      }>
    | Readonly<{
          operation: "remove";
          value: TestHandleType;
          parent: TestHandleType;
      }>
    | Readonly<{
          operation: "release";
          value: TestHandleType;
      }>
    | Readonly<{
          operation: "close";
      }>;

export type TestHostFixtureType = {
    readonly host: RendererHost<TestRootType, TestHandleType, TestHandleType>;
    readonly counters: TestHostCountersType;
    readonly primitives: ReadonlyMap<
        TemplatePrimitive<object>,
        RendererPrimitiveCapability<TestHandleType, TestHandleType, TemplatePrimitive<object>>
    >;
    readonly properties: ReadonlyMap<
        TemplateProperty,
        RendererPropertyCapability<TestHandleType, TemplatePrimitive<object>, unknown>
    >;
    readonly roots: readonly TestHandleType[];
    readonly children: ReadonlyMap<TestHandleType, readonly TestHandleType[]>;
    readonly primitivesByValue: ReadonlyMap<TestHandleType, TemplatePrimitive<object>>;
    readonly writes: ReadonlyMap<TestHandleType, ReadonlyMap<TemplateProperty, unknown>>;
    readonly calls: readonly TestHostCallType[];
    readonly trace: readonly TestHostTraceEntryType[];
};

export function createTestHost(
    support: readonly TestPrimitiveSupportType[],
    hooks: TestHostHooksType = {},
): TestHostFixtureType {
    const counters: TestHostCountersType = {
        open: 0,
        close: 0,
        create: 0,
        write: 0,
        place: 0,
        remove: 0,
        release: 0,
        primitiveResolutions: new Map(),
        propertyResolutions: new Map(),
    };
    const primitives = new Map<
        TemplatePrimitive<object>,
        RendererPrimitiveCapability<TestHandleType, TestHandleType, TemplatePrimitive<object>>
    >();
    const properties = new Map<
        TemplateProperty,
        RendererPropertyCapability<TestHandleType, TemplatePrimitive<object>, unknown>
    >();
    const roots: TestHandleType[] = [];
    const children = new Map<TestHandleType, TestHandleType[]>();
    const primitivesByValue = new Map<TestHandleType, TemplatePrimitive<object>>();
    const writes = new Map<TestHandleType, Map<TemplateProperty, unknown>>();
    const calls: TestHostCallType[] = [];
    const trace: TestHostTraceEntryType[] = [];
    let nextHandle = 1;

    for (const primitiveSupport of support) {
        const propertyCapabilities = new Map<
            TemplateProperty,
            RendererPropertyCapability<TestHandleType, TemplatePrimitive<object>, unknown>
        >();

        for (const propertySupport of primitiveSupport.properties ?? []) {
            const propertyCapability: RendererPropertyCapability<
                TestHandleType,
                TemplatePrimitive<object>,
                unknown
            > = {
                property: propertySupport.provided ?? propertySupport.requested,
                write(value, candidate) {
                    calls.push({
                        operation: "write",
                        property: propertySupport.requested,
                        value,
                        candidate,
                    });
                    hooks.onWrite?.(value, propertySupport.requested, candidate);
                    propertySupport.onWrite?.(value, candidate);
                    counters.write += 1;
                    let valueWrites = writes.get(value);

                    if (valueWrites === undefined) {
                        valueWrites = new Map();
                        writes.set(value, valueWrites);
                    }

                    valueWrites.set(propertySupport.requested, candidate);
                    trace.push({
                        operation: "write",
                        property: propertySupport.requested,
                        value,
                        candidate,
                    });
                },
            };

            propertyCapabilities.set(propertySupport.requested, propertyCapability);
            properties.set(propertySupport.requested, propertyCapability);
        }

        const capability: RendererPrimitiveCapability<
            TestHandleType,
            TestHandleType,
            TemplatePrimitive<object>
        > = {
            primitive: primitiveSupport.provided ?? primitiveSupport.requested,
            acceptsChildren: primitiveSupport.acceptsChildren ?? false,
            create() {
                calls.push({ operation: "create", primitive: primitiveSupport.requested });
                hooks.onCreate?.(primitiveSupport.requested);
                counters.create += 1;
                const value = { id: nextHandle++ };
                primitivesByValue.set(value, primitiveSupport.requested);
                children.set(value, []);
                trace.push({ operation: "create", primitive: primitiveSupport.requested, value });
                return value;
            },
            resolveProperty(property) {
                calls.push({
                    operation: "resolve-property",
                    primitive: primitiveSupport.requested,
                    property,
                });
                hooks.onResolveProperty?.(primitiveSupport.requested, property);
                counters.propertyResolutions.set(
                    property,
                    (counters.propertyResolutions.get(property) ?? 0) + 1,
                );
                return propertyCapabilities.get(property) as never;
            },
            release(value) {
                calls.push({ operation: "release", value });
                counters.release += 1;
                trace.push({ operation: "release", value });
                hooks.onRelease?.(value);
            },
        };

        primitives.set(primitiveSupport.requested, capability);
    }

    const host: RendererHost<TestRootType, TestHandleType, TestHandleType> = {
        open(rootValue) {
            calls.push({ operation: "open", root: rootValue });
            hooks.onOpen?.(rootValue);
            counters.open += 1;
            const root = { id: 0 };
            roots.push(root);
            children.set(root, []);

            return {
                root,
                resolvePrimitive(primitive) {
                    calls.push({ operation: "resolve-primitive", primitive });
                    hooks.onResolvePrimitive?.(primitive);
                    counters.primitiveResolutions.set(
                        primitive,
                        (counters.primitiveResolutions.get(primitive) ?? 0) + 1,
                    );
                    return primitives.get(primitive) as never;
                },
                place(value, destination, current) {
                    const destinationChildren = children.get(destination.parent);

                    if (destinationChildren === undefined) {
                        throw new TypeError("The test host destination parent is unknown.");
                    }

                    if (
                        destination.before !== null &&
                        !destinationChildren.includes(destination.before)
                    ) {
                        throw new TypeError("The test host placement anchor is not a child.");
                    }

                    if (destination.before === value) {
                        throw new TypeError("The test host cannot place a value before itself.");
                    }

                    calls.push({
                        operation: "place",
                        value,
                        parent: destination.parent,
                        before: destination.before,
                    });
                    hooks.onPlace?.(value, destination.parent, destination.before);

                    if (current !== undefined) {
                        const currentChildren = children.get(current.parent);
                        const currentIndex = currentChildren?.indexOf(value) ?? -1;

                        if (currentChildren === undefined || currentIndex < 0) {
                            throw new TypeError("The test host current attachment is invalid.");
                        }

                        currentChildren.splice(currentIndex, 1);
                    }

                    const insertionIndex =
                        destination.before === null
                            ? destinationChildren.length
                            : destinationChildren.indexOf(destination.before);
                    destinationChildren.splice(insertionIndex, 0, value);
                    counters.place += 1;
                    trace.push({
                        operation: "place",
                        value,
                        parent: destination.parent,
                        before: destination.before,
                    });
                },
                remove(value, current) {
                    const currentChildren = children.get(current.parent);
                    const currentIndex = currentChildren?.indexOf(value) ?? -1;

                    if (currentChildren === undefined || currentIndex < 0) {
                        throw new TypeError("The test host current attachment is invalid.");
                    }

                    calls.push({ operation: "remove", value, parent: current.parent });
                    hooks.onRemove?.(value, current.parent);

                    currentChildren.splice(currentIndex, 1);
                    counters.remove += 1;
                    trace.push({ operation: "remove", value, parent: current.parent });
                },
                close() {
                    calls.push({ operation: "close" });
                    counters.close += 1;
                    trace.push({ operation: "close" });
                    hooks.onClose?.();
                },
            };
        },
    };

    return {
        host,
        counters,
        primitives,
        properties,
        roots,
        children,
        primitivesByValue,
        writes,
        calls,
        trace,
    };
}

export function mutationCount(counters: TestHostCountersType): number {
    return counters.create + counters.write + counters.place + counters.remove + counters.release;
}
