import { Runtime, type Signal } from "@lilium/core";
import { Template } from "@lilium/template";
import { Renderer } from "../../api/renderer.api.js";
import type { RendererHostOperationType } from "../../error/types/renderer-host-operation.type.js";
import type { RendererConformanceAdapter } from "../contracts/renderer-conformance-adapter.contract.js";
import type { RendererConformanceAssertions } from "../contracts/renderer-conformance-assertions.contract.js";
import type { RendererConformanceScenario } from "../contracts/renderer-conformance-scenario.contract.js";
import type { RendererConformanceRootType } from "../types/renderer-conformance-root.type.js";

/** @description Parent primitive shared by every host-neutral conformance adapter. */
const ConformanceGroup = Template.primitive<{
    /** @description Static spacing candidate used by conformance scenarios. */
    gap: number;
}>("ConformanceGroup");

/** @description Static numeric property shared by every host-neutral conformance adapter. */
const ConformanceGroupGap = Template.property<number, typeof ConformanceGroup>(
    ConformanceGroup,
    "gap",
);

/** @description Leaf primitive shared by every host-neutral conformance adapter. */
const ConformanceLabel = Template.primitive<{
    /** @description Dynamic text candidate used by conformance scenarios. */
    text: string;
}>("ConformanceLabel");

/** @description Dynamic text property shared by every host-neutral conformance adapter. */
const ConformanceLabelText = Template.property<string, typeof ConformanceLabel>(
    ConformanceLabel,
    "text",
);

/** @description Creates the canonical scenario set for one host conformance adapter. */
export class RendererConformanceScenarioFactory {
    /** @description Concrete host factory and normalized observation bridge under test. */
    readonly #adapter: RendererConformanceAdapter;

    /**
     * @description Retains one host adapter without creating host or Renderer state.
     * @param adapter - Concrete host conformance adapter.
     */
    constructor(adapter: RendererConformanceAdapter) {
        this.#adapter = adapter;
    }

    /**
     * @description Creates fresh frozen scenarios that share no runtime or host state.
     * @returns Canonical universal Renderer behavior scenarios.
     */
    create(): readonly RendererConformanceScenario[] {
        return Object.freeze([
            this.#scenario("rejects an omitted primitive before host mutation", (assertions) =>
                this.#verifyMissingPrimitive(assertions),
            ),
            this.#scenario("rejects an omitted property before host mutation", (assertions) =>
                this.#verifyMissingProperty(assertions),
            ),
            this.#scenario(
                "mounts detached values, suppresses equal updates, and unmounts once",
                (assertions) => this.#verifyLifecycle(assertions),
            ),
            this.#scenario("rolls back construction after a placement failure", (assertions) =>
                this.#verifyPlacementFailure(assertions),
            ),
            this.#scenario(
                "terminalizes an application after a dynamic write failure",
                (assertions) => this.#verifyDynamicFailure(assertions),
            ),
            this.#scenario(
                "attempts cleanup in order and releases the root after terminal failures",
                (assertions) => this.#verifyCleanupFailures(assertions),
            ),
        ]);
    }

    /**
     * @description Creates one immutable scenario delegating to a fresh-state callback.
     * @param name - Stable scenario name.
     * @param run - Complete scenario behavior.
     * @returns Frozen scenario object.
     */
    #scenario(
        name: string,
        run: (assertions: RendererConformanceAssertions) => void,
    ): RendererConformanceScenario {
        return Object.freeze({ name, run });
    }

    /**
     * @description Verifies primitive incompatibility, closure, and zero mutation.
     * @param assertions - Test-runner-neutral assertions.
     * @returns Nothing when the behavior is conformant.
     */
    #verifyMissingPrimitive(assertions: RendererConformanceAssertions): void {
        const runtime = Runtime.create();
        const observed = this.#adapter.createHost({
            primitives: [{ primitive: ConformanceLabel }],
            omittedPrimitives: [ConformanceLabel],
        });
        const renderer = Renderer.createRuntime(runtime, observed.host);
        const root = this.#root("missing-primitive");
        const definition = Template.define({ roots: [Template.node(ConformanceLabel)] });

        assertions.throws(
            () => {
                renderer.mountTemplate(definition, { root, state: {} });
            },
            (error) => error instanceof Error && /missing-primitive/i.test(error.message),
        );
        assertions.deepEqual(observed.operations(root), ["open", "resolve-primitive", "close"]);
        assertions.equal(this.#mutationCount(observed.operations(root)), 0);
        runtime.dispose();
    }

    /**
     * @description Verifies property incompatibility, closure, and zero mutation.
     * @param assertions - Test-runner-neutral assertions.
     * @returns Nothing when the behavior is conformant.
     */
    #verifyMissingProperty(assertions: RendererConformanceAssertions): void {
        const runtime = Runtime.create();
        const observed = this.#adapter.createHost({
            primitives: [{ primitive: ConformanceLabel, properties: [ConformanceLabelText] }],
            omittedProperties: [ConformanceLabelText],
        });
        const renderer = Renderer.createRuntime(runtime, observed.host);
        const root = this.#root("missing-property");
        const definition = Template.define({
            roots: [
                Template.node(ConformanceLabel, {
                    properties: [Template.value(ConformanceLabelText, "Unsupported")],
                }),
            ],
        });

        assertions.throws(
            () => {
                renderer.mountTemplate(definition, { root, state: {} });
            },
            (error) => error instanceof Error && /missing-property/i.test(error.message),
        );
        assertions.deepEqual(observed.operations(root), [
            "open",
            "resolve-primitive",
            "resolve-property",
            "close",
        ]);
        assertions.equal(this.#mutationCount(observed.operations(root)), 0);
        runtime.dispose();
    }

    /**
     * @description Verifies preflight, detached construction, updates, and idempotent unmount.
     * @param assertions - Test-runner-neutral assertions.
     * @returns Nothing when the behavior is conformant.
     */
    #verifyLifecycle(assertions: RendererConformanceAssertions): void {
        /** @description Reactive state retained by the lifecycle conformance scenario. */
        type StateType = {
            /** @description Numeric source used to verify equal-value suppression. */
            readonly value: Signal<number>;
        };

        const runtime = Runtime.create();
        const value = runtime.signal(0);
        const observed = this.#adapter.createHost({
            primitives: [
                {
                    primitive: ConformanceGroup,
                    acceptsChildren: true,
                    properties: [ConformanceGroupGap],
                },
                { primitive: ConformanceLabel, properties: [ConformanceLabelText] },
            ],
        });
        const renderer = Renderer.createRuntime(runtime, observed.host);
        const root = this.#root("lifecycle");
        const definition = Template.define<StateType>({
            roots: [
                Template.node(ConformanceGroup, {
                    properties: [Template.value(ConformanceGroupGap, 8)],
                    children: [
                        Template.node(ConformanceLabel, {
                            properties: [
                                Template.binding(ConformanceLabelText, (state) =>
                                    String(Math.floor(state.value.get() / 10)),
                                ),
                            ],
                        }),
                    ],
                }),
            ],
        });
        const rendered = renderer.mountTemplate(definition, { root, state: { value } });

        assertions.ok(rendered);
        assertions.deepEqual(observed.operations(root), [
            "open",
            "resolve-primitive",
            "resolve-property",
            "resolve-primitive",
            "resolve-property",
            "create",
            "write",
            "create",
            "write",
            "place",
            "place",
        ]);
        assertions.deepEqual(observed.snapshot(root), [
            {
                primitive: ConformanceGroup,
                properties: [{ property: ConformanceGroupGap, value: 8 }],
                children: [
                    {
                        primitive: ConformanceLabel,
                        properties: [{ property: ConformanceLabelText, value: "0" }],
                        children: [],
                    },
                ],
            },
        ]);

        value.set(1);
        assertions.equal(this.#count(observed.operations(root), "write"), 2);
        value.set(10);
        assertions.equal(this.#count(observed.operations(root), "write"), 3);
        assertions.deepEqual(observed.snapshot(root)[0]?.children[0]?.properties, [
            { property: ConformanceLabelText, value: "1" },
        ]);

        rendered.dispose();
        rendered.dispose();
        assertions.deepEqual(observed.operations(root).slice(-5), [
            "remove",
            "remove",
            "release",
            "release",
            "close",
        ]);
        assertions.equal(this.#count(observed.operations(root), "close"), 1);
        runtime.dispose();
    }

    /**
     * @description Verifies failed placement atomicity and deterministic rollback.
     * @param assertions - Test-runner-neutral assertions.
     * @returns Nothing when the behavior is conformant.
     */
    #verifyPlacementFailure(assertions: RendererConformanceAssertions): void {
        const runtime = Runtime.create();
        const failure = new Error("conformance placement failure");
        const observed = this.#adapter.createHost({
            primitives: [
                { primitive: ConformanceGroup, acceptsChildren: true },
                { primitive: ConformanceLabel },
            ],
            failures: [{ operation: "place", occurrence: 2, error: failure }],
        });
        const renderer = Renderer.createRuntime(runtime, observed.host);
        const root = this.#root("placement-failure");
        const definition = Template.define({
            roots: [
                Template.node(ConformanceGroup, {
                    children: [Template.node(ConformanceLabel)],
                }),
            ],
        });

        assertions.throws(
            () => {
                renderer.mountTemplate(definition, { root, state: {} });
            },
            (error) => error === failure,
        );
        assertions.deepEqual(observed.operations(root), [
            "open",
            "resolve-primitive",
            "resolve-primitive",
            "create",
            "create",
            "place",
            "place",
            "remove",
            "release",
            "release",
            "close",
        ]);
        assertions.equal(this.#count(observed.completedOperations(root), "place"), 1);
        assertions.equal(this.#count(observed.operations(root), "close"), 1);
        runtime.dispose();
    }

    /**
     * @description Verifies dynamic host failure terminalization and binding cancellation.
     * @param assertions - Test-runner-neutral assertions.
     * @returns Nothing when the behavior is conformant.
     */
    #verifyDynamicFailure(assertions: RendererConformanceAssertions): void {
        const runtime = Runtime.create();
        const source = runtime.signal("Ready");
        const failure = new Error("conformance dynamic write failure");
        const observed = this.#adapter.createHost({
            primitives: [{ primitive: ConformanceLabel, properties: [ConformanceLabelText] }],
            failures: [{ operation: "write", occurrence: 2, error: failure }],
        });
        const renderer = Renderer.createRuntime(runtime, observed.host);
        const root = this.#root("dynamic-failure");
        const definition = Template.define({
            roots: [
                Template.node(ConformanceLabel, {
                    properties: [Template.binding(ConformanceLabelText, () => source.get())],
                }),
            ],
        });
        const rendered = renderer.mountTemplate(definition, { root, state: {} });

        assertions.ok(rendered);
        assertions.throws(
            () => {
                source.set("Failure");
            },
            (error) => error === failure,
        );
        assertions.equal(rendered.disposed, true);
        assertions.deepEqual(observed.operations(root).slice(-4), [
            "write",
            "remove",
            "release",
            "close",
        ]);
        const writes = this.#count(observed.operations(root), "write");
        source.set("Ignored");
        assertions.equal(this.#count(observed.operations(root), "write"), writes);
        runtime.dispose();
    }

    /**
     * @description Verifies best-effort cleanup, error ordering, terminal state, and root release.
     * @param assertions - Test-runner-neutral assertions.
     * @returns Nothing when the behavior is conformant.
     */
    #verifyCleanupFailures(assertions: RendererConformanceAssertions): void {
        const runtime = Runtime.create();
        const releaseSecond = new Error("conformance second release failure");
        const releaseFirst = new Error("conformance first release failure");
        const closeFailure = new Error("conformance close failure");
        const observed = this.#adapter.createHost({
            primitives: [{ primitive: ConformanceGroup }, { primitive: ConformanceLabel }],
            failures: [
                { operation: "release", occurrence: 1, error: releaseSecond },
                { operation: "release", occurrence: 2, error: releaseFirst },
                { operation: "close", error: closeFailure },
            ],
        });
        const renderer = Renderer.createRuntime(runtime, observed.host);
        const root = this.#root("cleanup-failures");
        const definition = Template.define({
            roots: [Template.node(ConformanceGroup), Template.node(ConformanceLabel)],
        });
        const rendered = renderer.mountTemplate(definition, { root, state: {} });

        assertions.ok(rendered);
        assertions.throws(
            () => {
                rendered.dispose();
            },
            (error) =>
                error instanceof AggregateError &&
                error.errors.length === 3 &&
                error.errors[0] === releaseSecond &&
                error.errors[1] === releaseFirst &&
                error.errors[2] === closeFailure,
        );
        assertions.equal(rendered.disposed, true);
        assertions.deepEqual(observed.operations(root).slice(-5), [
            "remove",
            "remove",
            "release",
            "release",
            "close",
        ]);

        const remounted = renderer.mountTemplate(Template.define({ roots: [] }), {
            root,
            state: {},
        });
        assertions.ok(remounted);
        assertions.throws(
            () => {
                remounted.dispose();
            },
            (error) => error === closeFailure,
        );
        runtime.dispose();
    }

    /**
     * @description Creates one exact external root for a scenario session.
     * @param name - Stable diagnostic root name.
     * @returns Fresh external root identity.
     */
    #root(name: string): RendererConformanceRootType {
        return { name };
    }

    /**
     * @description Counts one operation in an ordered host observation.
     * @param operations - Attempted or completed operation sequence.
     * @param operation - Exact operation to count.
     * @returns Number of matching appearances.
     */
    #count(
        operations: readonly RendererHostOperationType[],
        operation: RendererHostOperationType,
    ): number {
        return operations.filter((candidate) => candidate === operation).length;
    }

    /**
     * @description Counts attempted state-changing host operations.
     * @param operations - Attempted operation sequence.
     * @returns Number of create, write, place, remove, or release attempts.
     */
    #mutationCount(operations: readonly RendererHostOperationType[]): number {
        return operations.filter(
            (operation) =>
                operation === "create" ||
                operation === "write" ||
                operation === "place" ||
                operation === "remove" ||
                operation === "release",
        ).length;
    }
}
