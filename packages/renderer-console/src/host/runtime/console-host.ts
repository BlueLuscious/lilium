import type { RendererHostSession } from "@lilium/renderer";
import type { ConsolePrimitiveDefinition } from "../../capability/contracts/console-primitive-definition.contract.js";
import type { ConsolePrimitiveRegistry } from "../../capability/runtime/console-primitive.registry.js";
import { ConsoleFailureInjector } from "../../failure/runtime/console-failure.injector.js";
import type { ConsoleFailureInjectionType } from "../../failure/types/console-failure-injection.type.js";
import { ConsoleTraceRecorder } from "../../trace/runtime/console-trace.recorder.js";
import type { ConsoleTraceEntryType } from "../../trace/types/console-trace-entry.type.js";
import type { ConsoleHost as ConsoleHostContract } from "../contracts/console-host.contract.js";
import type { ConsoleRootSnapshot } from "../contracts/console-root-snapshot.contract.js";
import type { ConsoleHandleType } from "../types/console-handle.type.js";
import type { ConsoleHostOptionsType } from "../types/console-host-options.type.js";
import type { ConsolePrimitiveType } from "../types/console-primitive.type.js";
import type { ConsolePropertyType } from "../types/console-property.type.js";
import type { ConsoleRootType } from "../types/console-root.type.js";
import { ConsoleHostSession } from "./console-host.session.js";

/** @description Reusable private logical host implementing only public Renderer protocol contracts. */
export class ConsoleHost implements ConsoleHostContract {
    /** @description Immutable capability lookup keyed by exact Template primitive identity. */
    readonly #definitions: ReadonlyMap<ConsolePrimitiveType, ConsolePrimitiveDefinition>;
    /** @description Immutable primitive declarations preserving deterministic configuration order. */
    readonly #orderedDefinitions: readonly ConsolePrimitiveDefinition[];
    /** @description Primitive identities deliberately resolved as unsupported. */
    readonly #omittedPrimitives: ReadonlySet<ConsolePrimitiveType>;
    /** @description Property identities deliberately resolved as unsupported. */
    readonly #omittedProperties: ReadonlySet<ConsolePropertyType>;
    /** @description Normalized failure plan copied into a fresh injector for every opening attempt. */
    readonly #failures: readonly Required<ConsoleFailureInjectionType>[];
    /** @description Active exclusive sessions keyed by exact external root identity. */
    readonly #sessions = new WeakMap<ConsoleRootType, ConsoleHostSession>();
    /** @description Structured protocol recorders retained per observed external root. */
    readonly #traces = new WeakMap<ConsoleRootType, ConsoleTraceRecorder>();

    /**
     * @description Validates host options and creates one frozen reusable logical host.
     * @param options - Complete package-created primitive capability declarations.
     * @param primitives - Nominal registry validating every supplied declaration.
     * @returns Frozen Console host with no allocated session.
     */
    static create(
        options: ConsoleHostOptionsType,
        primitives: ConsolePrimitiveRegistry,
    ): ConsoleHostContract {
        if (typeof options !== "object" || options === null || Array.isArray(options)) {
            throw new TypeError("Console host options must be a non-array object.");
        }

        const definitions = primitives.normalize(options.primitives);
        const primitiveIdentities = new Set(definitions.map((definition) => definition.primitive));
        const propertyIdentities = new Set(
            definitions.flatMap((definition) => [...definition.properties]),
        );
        const omittedPrimitives = ConsoleHost.#normalizeOmissions(
            options.omittedPrimitives,
            primitiveIdentities,
            "primitive",
        );
        const omittedProperties = ConsoleHost.#normalizeOmissions(
            options.omittedProperties,
            propertyIdentities,
            "property",
        );
        const failures = ConsoleFailureInjector.normalize(options.failures);
        return new ConsoleHost(definitions, omittedPrimitives, omittedProperties, failures);
    }

    /**
     * @description Retains one immutable primitive lookup without allocating host state.
     * @param definitions - Complete normalized unique primitive declaration list.
     * @param omittedPrimitives - Configured primitive identities resolved as unsupported.
     * @param omittedProperties - Configured property identities resolved as unsupported.
     * @param failures - Normalized operation failure plan reset for each opening attempt.
     */
    private constructor(
        definitions: readonly ConsolePrimitiveDefinition[],
        omittedPrimitives: ReadonlySet<ConsolePrimitiveType>,
        omittedProperties: ReadonlySet<ConsolePropertyType>,
        failures: readonly Required<ConsoleFailureInjectionType>[],
    ) {
        this.#orderedDefinitions = definitions;
        this.#definitions = new Map(
            definitions.map((definition) => [definition.primitive, definition]),
        );
        this.#omittedPrimitives = omittedPrimitives;
        this.#omittedProperties = omittedProperties;
        this.#failures = failures;
        Object.freeze(this);
    }

    /**
     * @description Claims one exact external root and opens a new logical host session.
     * @param root - Externally owned logical root identity.
     * @returns Exclusive session with one opaque root-parent handle.
     */
    open(root: ConsoleRootType): RendererHostSession<ConsoleHandleType, ConsoleHandleType> {
        if (typeof root !== "object" || root === null || Array.isArray(root)) {
            throw new TypeError("A Console root must be a non-array object.");
        }

        if (this.#sessions.has(root)) {
            throw new Error("This Console host already has an active session for the root.");
        }

        const trace = new ConsoleTraceRecorder();
        const failures = new ConsoleFailureInjector(this.#failures);
        this.#traces.set(root, trace);
        trace.record("attempted", { operation: "open", root: 0 });
        failures.throwIfScheduled("open");
        let session: ConsoleHostSession;
        session = new ConsoleHostSession(
            root,
            this.#orderedDefinitions,
            this.#definitions,
            this.#omittedPrimitives,
            this.#omittedProperties,
            trace,
            failures,
            () => {
                if (this.#sessions.get(root) === session) {
                    this.#sessions.delete(root);
                }
            },
        );
        this.#sessions.set(root, session);
        trace.record("completed", { operation: "open", root: 0 });
        return session;
    }

    /**
     * @description Captures the current logical tree for one active root session.
     * @param root - Exact active external root identity.
     * @returns Deeply immutable recursive logical tree snapshot.
     */
    snapshot(root: ConsoleRootType): ConsoleRootSnapshot {
        const session = this.#sessions.get(root);

        if (session === undefined) {
            throw new Error("The Console root has no active host session.");
        }

        return session.snapshot();
    }

    /**
     * @description Captures deterministic stages for one current or completed root.
     * @param root - Exact external root identity previously opened by this host.
     * @returns Frozen attempted and completed operation entries preserving exact order.
     */
    trace(root: ConsoleRootType): readonly ConsoleTraceEntryType[] {
        const trace = this.#traces.get(root);

        if (trace === undefined) {
            throw new Error("The Console root has no host operation trace.");
        }

        return trace.snapshot();
    }

    /**
     * @description Validates one optional unique configured capability omission list.
     * @typeParam Capability - Primitive or property identity accepted by the host configuration.
     * @param candidates - Optional capability identities to resolve as unsupported.
     * @param configured - Complete configured capability identity set.
     * @param subject - Diagnostic capability family name.
     * @returns Frozen omission identity set.
     */
    static #normalizeOmissions<Capability extends object>(
        candidates: readonly Capability[] | undefined,
        configured: ReadonlySet<Capability>,
        subject: string,
    ): ReadonlySet<Capability> {
        if (candidates === undefined) {
            return new Set();
        }

        if (!Array.isArray(candidates)) {
            throw new TypeError(`Console omitted ${subject} capabilities must be an array.`);
        }

        const normalized = new Set<Capability>();
        for (const candidate of candidates) {
            if (!configured.has(candidate)) {
                throw new TypeError(`Console cannot omit an unconfigured ${subject} capability.`);
            }

            if (normalized.has(candidate)) {
                throw new TypeError(
                    `Console cannot omit one ${subject} capability more than once.`,
                );
            }

            normalized.add(candidate);
        }

        return normalized;
    }
}
