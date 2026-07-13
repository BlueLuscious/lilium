import type { OwnershipManager } from "../../../ownership/runtime/ownership.manager.js";
import type { Signal } from "../../contracts/signal/signal.contract.js";
import type {
    IReactiveSource,
    REACTIVE_SOURCE_BRAND,
} from "../../contracts/internal/tracking/reactive-source.contract.js";
import type { IReactiveRuntimeContext } from "../../contracts/internal/tracking/reactive-runtime-context.contract.js";
import type { SignalEqualityType } from "../../types/signal/signal-equality.type.js";
import type { SignalOptionsType } from "../../types/signal/signal-options.type.js";
import type { SignalUpdaterType } from "../../types/signal/signal-updater.type.js";

/**
 * @description Internal shallow mutable implementation of the public Signal contract.
 * @remarks Writes are explicit, equality and updater callbacks execute untracked, and
 * ownership disposal permanently closes the cell and removes every source graph edge.
 * @typeParam T - Value stored by the signal.
 */
export class SignalRuntime<T> implements Signal<T>, IReactiveSource {
    /** @description Type-only identity required by the internal reactive source role. */
    declare readonly [REACTIVE_SOURCE_BRAND]: true;

    /** @description Immutable equality policy selected when the signal is created. */
    readonly #equals: SignalEqualityType<T>;

    /** @description Whether ownership disposal has permanently closed this signal. */
    #disposed = false;

    /** @description Latest value accepted by signal equality. */
    #value: T;

    /** @description Runtime context that owns this signal and its graph edges. */
    readonly runtime: IReactiveRuntimeContext;

    /**
     * @description Creates and registers one shallow signal under the active runtime owner.
     * @param runtime - Runtime-isolated reactive context that owns graph operations.
     * @param ownership - Ownership service receiving this signal's disposal operation.
     * @param initialValue - Value stored before the first explicit write.
     * @param options - Optional immutable equality configuration.
     */
    constructor(
        runtime: IReactiveRuntimeContext,
        ownership: OwnershipManager,
        initialValue: T,
        options?: SignalOptionsType<T>,
    ) {
        this.runtime = runtime;
        this.#value = initialValue;
        this.#equals = options?.equals ?? Object.is;
        ownership.own(() => {
            this.#dispose();
            return undefined;
        });
    }

    /**
     * @description Reads the current value and records this source for an active consumer.
     * @returns The latest value accepted by this signal.
     */
    get(): T {
        this.#assertOpen("read");
        this.runtime.tracker.track(this);
        return this.#value;
    }

    /**
     * @description Accepts and propagates a candidate value when equality reports a change.
     * @param value - Candidate value compared with the latest stored value.
     * @returns Nothing.
     */
    set(value: T): void {
        this.#assertOpen("write");
        const equal = this.runtime.tracker.untrack(
            () => this.#equals(this.#value, value),
        );

        if (equal) {
            return;
        }

        this.#value = value;
        this.runtime.tracker.invalidate(this);
        this.runtime.requestFlush();
    }

    /**
     * @description Derives and writes a candidate from the latest stored signal value.
     * @param updater - Pure untracked operation producing the candidate value.
     * @returns Nothing.
     */
    update(updater: SignalUpdaterType<T>): void {
        this.#assertOpen("update");
        const value = this.runtime.tracker.untrack(() => updater(this.#value));
        this.set(value);
    }

    /**
     * @description Permanently closes this signal and removes all connected source edges.
     * @returns Nothing.
     */
    #dispose(): void {
        if (this.#disposed) {
            return;
        }

        this.#disposed = true;
        this.runtime.tracker.disconnectSource(this);
    }

    /**
     * @description Verifies that ownership disposal has not closed the signal.
     * @param operation - Human-readable operation used in the disposal error.
     * @returns Nothing.
     */
    #assertOpen(operation: string): void {
        if (this.#disposed) {
            throw new Error(`Cannot ${operation} a disposed signal.`);
        }
    }
}
