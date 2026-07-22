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
};

export type TestPrimitiveSupportType = {
    readonly requested: TemplatePrimitive<object>;
    readonly provided?: TemplatePrimitive<object>;
    readonly acceptsChildren?: boolean;
    readonly properties?: readonly TestPropertySupportType[];
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
};

export function createTestHost(support: readonly TestPrimitiveSupportType[]): TestHostFixtureType {
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
                write() {
                    counters.write += 1;
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
                counters.create += 1;
                return { id: nextHandle++ };
            },
            resolveProperty(property) {
                counters.propertyResolutions.set(
                    property,
                    (counters.propertyResolutions.get(property) ?? 0) + 1,
                );
                return propertyCapabilities.get(property) as never;
            },
            release() {
                counters.release += 1;
            },
        };

        primitives.set(primitiveSupport.requested, capability);
    }

    const host: RendererHost<TestRootType, TestHandleType, TestHandleType> = {
        open() {
            counters.open += 1;

            return {
                root: { id: 0 },
                resolvePrimitive(primitive) {
                    counters.primitiveResolutions.set(
                        primitive,
                        (counters.primitiveResolutions.get(primitive) ?? 0) + 1,
                    );
                    return primitives.get(primitive) as never;
                },
                place() {
                    counters.place += 1;
                },
                remove() {
                    counters.remove += 1;
                },
                close() {
                    counters.close += 1;
                },
            };
        },
    };

    return { host, counters, primitives, properties };
}

export function mutationCount(counters: TestHostCountersType): number {
    return counters.create + counters.write + counters.place + counters.remove + counters.release;
}
