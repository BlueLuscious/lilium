import type { RendererHostOperationType, RendererHostSession } from "@lilium/renderer";
import type { ConsolePrimitiveDefinition } from "../../capability/contracts/console-primitive-definition.contract.js";
import type { ConsolePrimitiveRegistry } from "../../capability/runtime/console-primitive.registry.js";
import type { ConsoleHost as ConsoleHostContract } from "../contracts/console-host.contract.js";
import type { ConsoleRootSnapshot } from "../contracts/console-root-snapshot.contract.js";
import type { ConsoleHandleType } from "../types/console-handle.type.js";
import type { ConsoleHostOptionsType } from "../types/console-host-options.type.js";
import type { ConsolePrimitiveType } from "../types/console-primitive.type.js";
import type { ConsoleRootType } from "../types/console-root.type.js";
import { ConsoleHostSession } from "./console-host.session.js";

/** @description Reusable private logical host implementing only public Renderer protocol contracts. */
export class ConsoleHost implements ConsoleHostContract {
    /** @description Immutable capability lookup keyed by exact Template primitive identity. */
    readonly #definitions: ReadonlyMap<ConsolePrimitiveType, ConsolePrimitiveDefinition>;
    /** @description Active exclusive sessions keyed by exact external root identity. */
    readonly #sessions = new WeakMap<ConsoleRootType, ConsoleHostSession>();
    /** @description Successful protocol operation ledgers retained per observed external root. */
    readonly #traces = new WeakMap<ConsoleRootType, RendererHostOperationType[]>();

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
        return new ConsoleHost(definitions);
    }

    /**
     * @description Retains one immutable primitive lookup without allocating host state.
     * @param definitions - Complete normalized unique primitive declaration list.
     */
    private constructor(definitions: readonly ConsolePrimitiveDefinition[]) {
        this.#definitions = new Map(
            definitions.map((definition) => [definition.primitive, definition]),
        );
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

        const trace: RendererHostOperationType[] = ["open"];
        let session: ConsoleHostSession;
        session = new ConsoleHostSession(root, this.#definitions, trace, () => {
            if (this.#sessions.get(root) === session) {
                this.#sessions.delete(root);
            }
        });
        this.#sessions.set(root, session);
        this.#traces.set(root, trace);
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
     * @description Captures successful operations for one current or completed root.
     * @param root - Exact external root identity previously opened by this host.
     * @returns Frozen operation-name copy preserving protocol order.
     */
    trace(root: ConsoleRootType): readonly RendererHostOperationType[] {
        const trace = this.#traces.get(root);

        if (trace === undefined) {
            throw new Error("The Console root has no host operation trace.");
        }

        return Object.freeze([...trace]);
    }
}
