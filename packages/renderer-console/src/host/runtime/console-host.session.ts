import type {
    RendererAttachmentType,
    RendererHostOperationType,
    RendererHostSession,
    RendererPlacementType,
    RendererPrimitiveCapability,
    RendererPropertyCapability,
} from "@lilium/renderer";
import type { ConsolePrimitiveDefinition } from "../../capability/contracts/console-primitive-definition.contract.js";
import type { ConsoleRootSnapshot } from "../contracts/console-root-snapshot.contract.js";
import type { ConsoleValueSnapshot } from "../contracts/console-value-snapshot.contract.js";
import type { ConsoleHandleType } from "../types/console-handle.type.js";
import type { ConsolePrimitiveType } from "../types/console-primitive.type.js";
import type { ConsolePropertyType } from "../types/console-property.type.js";
import type { ConsolePropertySnapshotType } from "../types/console-property-snapshot.type.js";
import type { ConsoleRootType } from "../types/console-root.type.js";
import type { TConsoleHandleRecord } from "../types/internal/console-handle-record.type.js";
import type { TConsoleSessionState } from "../types/internal/console-session-state.type.js";
import { ConsoleHandle } from "./console-handle.js";

/** @description Owns one exclusive logical tree and its Renderer host-session operations. */
export class ConsoleHostSession
    implements RendererHostSession<ConsoleHandleType, ConsoleHandleType>
{
    /** @description Exact external root identity borrowed by this session. */
    readonly #rootValue: ConsoleRootType;
    /** @description Opaque root-parent handle exposed to Renderer. */
    readonly #root: ConsoleHandleType;
    /** @description Configured primitive definitions keyed by exact Template identity. */
    readonly #definitions: ReadonlyMap<ConsolePrimitiveType, ConsolePrimitiveDefinition>;
    /** @description Mutable records keyed by opaque session-local handle identity. */
    readonly #records = new Map<ConsoleHandleType, TConsoleHandleRecord>();
    /** @description Shared successful-operation ledger retained by the owning host. */
    readonly #trace: RendererHostOperationType[];
    /** @description Callback releasing the owning host's external-root claim. */
    readonly #releaseClaim: () => void;
    /** @description Irreversible session lifecycle. */
    #state: TConsoleSessionState = "open";
    /** @description Next deterministic value identifier after root identifier zero. */
    #nextId = 1;

    /**
     * @description Creates one open session with an opaque logical root handle.
     * @param rootValue - Exact externally owned root identity claimed by the host.
     * @param definitions - Complete immutable capability lookup for this host.
     * @param trace - Host-owned successful-operation ledger beginning with open.
     * @param releaseClaim - Callback releasing the exact host-root claim on closure.
     */
    constructor(
        rootValue: ConsoleRootType,
        definitions: ReadonlyMap<ConsolePrimitiveType, ConsolePrimitiveDefinition>,
        trace: RendererHostOperationType[],
        releaseClaim: () => void,
    ) {
        this.#rootValue = rootValue;
        this.#definitions = definitions;
        this.#trace = trace;
        this.#releaseClaim = releaseClaim;
        this.#root = this.#createHandle({
            id: 0,
            primitive: undefined,
            children: [],
            properties: new Map(),
            parent: undefined,
            released: false,
        });
    }

    /**
     * @description Returns the opaque parent handle wrapping the borrowed external root.
     * @returns Stable root-parent handle for this session.
     */
    get root(): ConsoleHandleType {
        return this.#root;
    }

    /**
     * @description Resolves one configured primitive capability by exact identity.
     * @typeParam Primitive - Exact requested primitive identity.
     * @param primitive - Primitive requested during Renderer preflight.
     * @returns A session-bound capability, or undefined when unsupported.
     */
    resolvePrimitive<Primitive extends ConsolePrimitiveType>(
        primitive: Primitive,
    ): RendererPrimitiveCapability<ConsoleHandleType, ConsoleHandleType, Primitive> | undefined {
        this.#assertOpen();
        const definition = this.#definitions.get(primitive);
        this.#trace.push("resolve-primitive");

        if (definition === undefined) {
            return undefined;
        }

        const capability: RendererPrimitiveCapability<
            ConsoleHandleType,
            ConsoleHandleType,
            Primitive
        > = {
            primitive,
            acceptsChildren: definition.acceptsChildren,
            create: () => this.#createValue(definition),
            resolveProperty: (property) => {
                this.#assertOpen();
                const supported = definition.properties.some((candidate) => candidate === property);
                this.#trace.push("resolve-property");

                if (!supported) {
                    return undefined;
                }

                const propertyCapability: RendererPropertyCapability<
                    ConsoleHandleType,
                    Primitive,
                    typeof property extends ConsolePropertyType<Primitive> ? unknown : never
                > = {
                    property,
                    write: (value, candidate) =>
                        this.#write(value, definition, property, candidate),
                };

                return Object.freeze(propertyCapability) as never;
            },
            release: (value) => this.#release(value, definition),
        };

        return Object.freeze(capability);
    }

    /**
     * @description Atomically inserts or moves one live logical value.
     * @param value - Session-owned live value handle.
     * @param destination - Valid destination parent and before-sibling anchor.
     * @param current - Renderer-owned current parent metadata, or undefined while detached.
     * @returns Nothing after the logical child sequence is updated.
     */
    place(
        value: ConsoleHandleType,
        destination: RendererPlacementType<ConsoleHandleType, ConsoleHandleType>,
        current: RendererAttachmentType<ConsoleHandleType> | undefined,
    ): void {
        this.#assertOpen();
        const valueRecord = this.#valueRecord(value);
        const parentRecord = this.#parentRecord(destination.parent);

        if (
            current === undefined
                ? valueRecord.parent !== undefined
                : valueRecord.parent !== current.parent
        ) {
            throw new TypeError("Console placement current attachment does not match host state.");
        }

        if (destination.before === value) {
            throw new TypeError("A Console value cannot be placed before itself.");
        }

        if (destination.before !== null) {
            const beforeRecord = this.#valueRecord(destination.before);

            if (beforeRecord.parent !== destination.parent) {
                throw new TypeError("Console placement anchor is not a child of its destination.");
            }
        }

        for (
            let ancestor: ConsoleHandleType | undefined = destination.parent;
            ancestor !== undefined;
            ancestor = this.#record(ancestor).parent
        ) {
            if (ancestor === value) {
                throw new TypeError("A Console value cannot be placed inside its own subtree.");
            }
        }

        if (valueRecord.parent !== undefined) {
            const previousChildren = this.#record(valueRecord.parent).children;
            previousChildren.splice(previousChildren.indexOf(value), 1);
        }

        const insertionIndex =
            destination.before === null
                ? parentRecord.children.length
                : parentRecord.children.indexOf(destination.before);
        parentRecord.children.splice(insertionIndex, 0, value);
        valueRecord.parent = destination.parent;
        this.#trace.push("place");
    }

    /**
     * @description Atomically detaches one live immediate logical child.
     * @param value - Session-owned attached value handle.
     * @param current - Renderer-owned current parent metadata.
     * @returns Nothing after the value becomes detached.
     */
    remove(value: ConsoleHandleType, current: RendererAttachmentType<ConsoleHandleType>): void {
        this.#assertOpen();
        const valueRecord = this.#valueRecord(value);

        if (valueRecord.parent !== current.parent) {
            throw new TypeError("Console removal attachment does not match host state.");
        }

        const parentRecord = this.#parentRecord(current.parent);
        const index = parentRecord.children.indexOf(value);

        if (index < 0) {
            throw new TypeError("Console removal value is not an immediate parent child.");
        }

        parentRecord.children.splice(index, 1);
        valueRecord.parent = undefined;
        this.#trace.push("remove");
    }

    /**
     * @description Idempotently closes this session after every value has been released.
     * @returns Nothing after the host-root claim is released.
     */
    close(): void {
        if (this.#state === "closed") {
            return;
        }

        const live = [...this.#records.values()].some(
            (record) => record.primitive !== undefined && !record.released,
        );

        if (live) {
            throw new Error("A Console session cannot close while it owns live values.");
        }

        this.#state = "closed";
        this.#trace.push("close");
        this.#releaseClaim();
    }

    /**
     * @description Captures one deeply immutable recursive logical tree snapshot.
     * @returns Current active root and ordered value observations.
     */
    snapshot(): ConsoleRootSnapshot {
        this.#assertOpen();
        const root = this.#record(this.#root);

        return Object.freeze({
            root: this.#rootValue,
            children: Object.freeze(root.children.map((value) => this.#snapshotValue(value))),
        });
    }

    /**
     * @description Creates one detached value owned by an exact primitive declaration.
     * @param primitive - Configured primitive declaration creating the value.
     * @returns New opaque live value handle.
     */
    #createValue(primitive: ConsolePrimitiveDefinition): ConsoleHandleType {
        this.#assertOpen();
        const value = this.#createHandle({
            id: this.#nextId,
            primitive,
            children: [],
            properties: new Map(),
            parent: undefined,
            released: false,
        });
        this.#nextId += 1;
        this.#trace.push("create");
        return value;
    }

    /**
     * @description Commits one supported property candidate to one matching live value.
     * @param value - Session-owned live value handle.
     * @param primitive - Primitive declaration expected to own the value.
     * @param property - Supported exact property identity.
     * @param candidate - Candidate value committed by Renderer.
     * @returns Nothing after the latest property snapshot is replaced.
     */
    #write(
        value: ConsoleHandleType,
        primitive: ConsolePrimitiveDefinition,
        property: ConsolePropertyType,
        candidate: unknown,
    ): void {
        this.#assertOpen();
        const record = this.#valueRecord(value);

        if (record.primitive !== primitive) {
            throw new TypeError(
                "Console property capability cannot write another primitive value.",
            );
        }

        record.properties.set(property, candidate);
        this.#trace.push("write");
    }

    /**
     * @description Permanently releases one matching detached leaf value.
     * @param value - Session-owned value handle being released.
     * @param primitive - Primitive declaration whose capability created the value.
     * @returns Nothing after terminal release.
     */
    #release(value: ConsoleHandleType, primitive: ConsolePrimitiveDefinition): void {
        this.#assertOpen();
        const record = this.#valueRecord(value);

        if (record.primitive !== primitive) {
            throw new TypeError("Console primitive capability cannot release another value.");
        }

        if (record.parent !== undefined || record.children.length > 0) {
            throw new Error("A Console value must be detached and empty before release.");
        }

        record.released = true;
        this.#trace.push("release");
    }

    /**
     * @description Creates one opaque handle and associates its private mutable record.
     * @param record - Initial private state for the new identity.
     * @returns Opaque handle recognized only by this session map.
     */
    #createHandle(record: TConsoleHandleRecord): ConsoleHandleType {
        const handle = new ConsoleHandle() as ConsoleHandleType;
        this.#records.set(handle, record);
        return handle;
    }

    /**
     * @description Resolves one session-owned handle record.
     * @param handle - Candidate opaque handle.
     * @returns Exact private record.
     */
    #record(handle: ConsoleHandleType): TConsoleHandleRecord {
        const record = this.#records.get(handle);

        if (record === undefined) {
            throw new TypeError("Console handle does not belong to this host session.");
        }

        return record;
    }

    /**
     * @description Resolves one live non-root value record.
     * @param handle - Candidate opaque value handle.
     * @returns Exact live value record.
     */
    #valueRecord(handle: ConsoleHandleType): TConsoleHandleRecord {
        const record = this.#record(handle);

        if (record.primitive === undefined) {
            throw new TypeError("The Console root handle is not a primitive value.");
        }

        if (record.released) {
            throw new Error("A released Console value cannot be reused.");
        }

        return record;
    }

    /**
     * @description Resolves one live parent that accepts logical children.
     * @param handle - Candidate root or value parent handle.
     * @returns Exact live parent record.
     */
    #parentRecord(handle: ConsoleHandleType): TConsoleHandleRecord {
        const record = this.#record(handle);

        if (record.released) {
            throw new Error("A released Console value cannot receive children.");
        }

        if (record.primitive !== undefined && !record.primitive.acceptsChildren) {
            throw new Error("This Console primitive does not accept children.");
        }

        return record;
    }

    /**
     * @description Creates one immutable recursive value snapshot.
     * @param handle - Live logical value to observe.
     * @returns Deeply immutable value snapshot.
     */
    #snapshotValue(handle: ConsoleHandleType): ConsoleValueSnapshot {
        const record = this.#valueRecord(handle);
        const primitive = record.primitive as ConsolePrimitiveDefinition;
        const properties: ConsolePropertySnapshotType[] = [...record.properties].map(
            ([property, value]) => Object.freeze({ property, value }),
        );

        return Object.freeze({
            id: record.id,
            primitive: primitive.primitive,
            properties: Object.freeze(properties),
            children: Object.freeze(record.children.map((child) => this.#snapshotValue(child))),
        });
    }

    /**
     * @description Rejects every protocol operation after terminal closure.
     * @returns Nothing while the session remains open.
     */
    #assertOpen(): void {
        if (this.#state !== "open") {
            throw new Error("Console host session is closed.");
        }
    }
}
