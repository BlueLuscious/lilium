import type { OwnershipManager } from "../../../ownership/runtime/ownership.manager.js";
import type {
    ISchedulerJob,
    // biome-ignore lint/correctness/noUnusedImports: The unique symbol brands a declare-only property.
    SCHEDULER_JOB_BRAND,
} from "../../../scheduler/contracts/internal/scheduler-job.contract.js";
import type { Effect } from "../../contracts/effect/effect.contract.js";
import type {
    IReactiveConsumer,
    // biome-ignore lint/correctness/noUnusedImports: The unique symbol brands a declare-only property.
    REACTIVE_CONSUMER_BRAND,
} from "../../contracts/internal/tracking/reactive-consumer.contract.js";
import type { IReactiveRuntimeContext } from "../../contracts/internal/tracking/reactive-runtime-context.contract.js";
import type { EffectCleanupType } from "../../types/effect/effect-cleanup.type.js";
import type { EffectFunctionType } from "../../types/effect/effect-function.type.js";
import { EffectExecutionRuntime } from "./effect-execution.runtime.js";

/**
 * @description Internal owned implementation of a scheduled synchronous reactive effect.
 * @remarks The object is both a dependency consumer and an identity-bearing effect-phase
 * scheduler job. Successful attempts commit dependencies and cleanup resources together.
 */
export class EffectRuntime implements Effect, IReactiveConsumer, ISchedulerJob {
    /** @description Type-only identity required by the internal reactive consumer role. */
    declare readonly [REACTIVE_CONSUMER_BRAND]: true;

    /** @description Type-only identity required by the internal scheduler job role. */
    declare readonly [SCHEDULER_JOB_BRAND]: true;

    /** @description Scheduler phase assigned to every user effect execution. */
    readonly phase = "effect" as const;

    /** @description Execution currently collecting candidate cleanup resources. */
    #activeExecution: EffectExecutionRuntime | null = null;

    /** @description Cleanups committed by the latest successful callback execution. */
    #cleanups: EffectCleanupType[] = [];

    /** @description Immutable synchronous callback represented by this effect identity. */
    readonly #effect: EffectFunctionType;

    /** @description Whether this effect has permanently completed disposal. */
    #disposed = false;

    /** @description Runtime context owning tracking and scheduling for this effect. */
    readonly runtime: IReactiveRuntimeContext;

    /**
     * @description Creates, owns, and schedules one initial effect execution.
     * @param runtime - Runtime context owning this effect's graph and scheduler state.
     * @param ownership - Ownership service receiving this effect's disposer.
     * @param effect - Synchronous tracked callback executed in the effect phase.
     */
    constructor(
        runtime: IReactiveRuntimeContext,
        ownership: OwnershipManager,
        effect: EffectFunctionType,
    ) {
        this.runtime = runtime;
        this.#effect = effect;
        ownership.own(() => {
            this.#dispose();
            return undefined;
        });
        this.runtime.scheduler.enqueue(this);
        this.runtime.requestFlush();
    }

    /**
     * @description Permanently cancels, disconnects, and releases this effect.
     * @remarks Repeated disposal is safe, including after cleanup failures.
     * @returns Nothing.
     */
    dispose(): void {
        this.#dispose();
    }

    /**
     * @description Executes one scheduled attempt and commits its candidate resources.
     * @returns `undefined` after execution completes or the disposed job is skipped.
     */
    execute(): undefined {
        if (this.#disposed) {
            return undefined;
        }

        const previousCleanups = this.#cleanups;
        this.#cleanups = [];
        const previousCleanupErrors = this.#release(previousCleanups);
        this.#throwCollected(previousCleanupErrors, "Effect cleanup failed before reevaluation.");

        if (this.#disposed) {
            return undefined;
        }

        const execution = new EffectExecutionRuntime();
        this.#activeExecution = execution;

        try {
            try {
                this.runtime.tracker.collect(this, () => {
                    const result = this.#effect(execution);

                    if (result !== undefined) {
                        throw new TypeError("Effect callbacks must return undefined.");
                    }

                    return undefined;
                });
            } catch (error) {
                const cleanupErrors = this.#release(execution.close());
                this.#throwCollected(
                    [error, ...cleanupErrors],
                    "Effect execution and candidate cleanup failed.",
                );
            }

            const candidateCleanups = execution.close();

            if (this.#disposed) {
                this.runtime.tracker.disconnect(this);
                this.#throwCollected(
                    this.#release(candidateCleanups),
                    "Disposed effect candidate cleanup failed.",
                );
                return undefined;
            }

            this.#cleanups = candidateCleanups;
            return undefined;
        } finally {
            execution.close();
            this.#activeExecution = null;
        }
    }

    /**
     * @description Enqueues this effect once after a connected source invalidates it.
     * @returns Nothing.
     */
    invalidate(): void {
        if (!this.#disposed) {
            this.runtime.scheduler.enqueue(this);
        }
    }

    /**
     * @description Closes this effect and releases every committed or active resource.
     * @returns Nothing.
     */
    #dispose(): void {
        if (this.#disposed) {
            return;
        }

        this.#disposed = true;
        this.runtime.scheduler.cancel(this);
        this.runtime.tracker.disconnect(this);

        const activeCleanups = this.#activeExecution?.close() ?? [];
        const cleanupErrors = this.#release([...this.#cleanups, ...activeCleanups]);
        this.#cleanups = [];
        this.#throwCollected(cleanupErrors, "Effect disposal cleanup failed.");
    }

    /**
     * @description Releases all supplied cleanups untracked in reverse registration order.
     * @param cleanups - Cleanup ledger transferred from one effect execution.
     * @returns Failures collected in cleanup execution order.
     */
    #release(cleanups: EffectCleanupType[]): unknown[] {
        const errors: unknown[] = [];

        for (let index = cleanups.length - 1; index >= 0; index -= 1) {
            try {
                const result = this.runtime.tracker.untrack(cleanups[index]);

                if (result !== undefined) {
                    throw new TypeError("Effect cleanups must return undefined.");
                }
            } catch (error) {
                errors.push(error);
            }
        }

        cleanups.length = 0;
        return errors;
    }

    /**
     * @description Throws one collected failure directly or several as one aggregate.
     * @param errors - Failures collected from one complete effect operation.
     * @param message - Deterministic message used when failures require aggregation.
     * @returns Nothing when no error exists; otherwise this operation throws.
     */
    #throwCollected(errors: unknown[], message: string): void {
        if (errors.length === 1) {
            throw errors[0];
        }

        if (errors.length > 1) {
            throw new AggregateError(errors, message);
        }
    }
}
