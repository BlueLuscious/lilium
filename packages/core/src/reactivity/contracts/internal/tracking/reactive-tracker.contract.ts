import type { TReactiveComputation } from "../../../types/internal/tracking/reactive-computation.type.js";
import type { IReactiveConsumer } from "./reactive-consumer.contract.js";
import type { IReactiveSource } from "./reactive-source.contract.js";

/**
 * @description Internal service that owns dependency collection and graph connections.
 * @remarks The tracker encapsulates active-consumer state and graph representation so
 * sources and consumers do not expose mutable dependency collections.
 */
export interface IReactiveTracker {
    /**
     * @description Executes a computation while transactionally collecting its dependencies.
     * @remarks A successful execution replaces the consumer's previous dependency set.
     * A failed execution restores the previous set and rethrows the original error.
     * @typeParam T - Value returned by the computation.
     * @param consumer - Consumer whose dependencies are being collected.
     * @param computation - Operation executed with the consumer active.
     * @returns The value returned by the computation.
     */
    collect<T>(consumer: IReactiveConsumer, computation: TReactiveComputation<T>): T;

    /**
     * @description Records a source read for the active consumer.
     * @remarks The operation is a no-op when no consumer is active and deduplicates
     * repeated reads of the same source during one collection.
     * @param source - Reactive source that was read.
     * @returns Nothing.
     */
    track(source: IReactiveSource): void;

    /**
     * @description Invalidates every consumer currently connected to a changed source.
     * @param source - Source whose accepted value changed.
     * @returns Nothing.
     */
    invalidate(source: IReactiveSource): void;

    /**
     * @description Removes every dependency owned by a consumer.
     * @remarks Repeated disconnection is safe and has no additional effect.
     * @param consumer - Consumer being disconnected from the graph.
     * @returns Nothing.
     */
    disconnect(consumer: IReactiveConsumer): void;

    /**
     * @description Executes an operation without collecting reactive reads.
     * @typeParam T - Value returned by the operation.
     * @param computation - Operation executed with tracking suspended.
     * @returns The value returned by the operation.
     */
    untrack<T>(computation: TReactiveComputation<T>): T;
}
