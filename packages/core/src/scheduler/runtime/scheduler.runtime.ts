import type { ScopeRuntime } from "../../ownership/runtime/scope.runtime.js";
import type { OwnershipManager } from "../../ownership/runtime/ownership.manager.js";
import type { ISchedulerJob } from "../contracts/internal/scheduler/scheduler-job.contract.js";
import type { IScheduler } from "../contracts/internal/scheduler/scheduler.contract.js";
import type { TSchedulerPhase } from "../types/internal/scheduler/scheduler-phase.type.js";
import type { TSchedulerQueueEntry } from "../types/internal/scheduler/scheduler-queue-entry.type.js";

/** @description Maximum number of complete scheduler cycles allowed by one outer flush. */
const SCHEDULER_CYCLE_LIMIT = 100;

/**
 * @description Runtime-isolated deterministic scheduler for render and effect jobs.
 * @remarks Jobs are deduplicated by identity while pending. Reentrant work is assigned to
 * the earliest phase that preserves strict `render` then `effect` cycle ordering.
 */
export class SchedulerRuntime implements IScheduler {
    /** @description Effect entries eligible for the currently processed scheduler cycle. */
    #currentEffectEntries: TSchedulerQueueEntry[] = [];

    /** @description Render entries eligible for the currently processed scheduler cycle. */
    #currentRenderEntries: TSchedulerQueueEntry[] = [];

    /** @description Effect entries deferred until the following scheduler cycle. */
    #nextEffectEntries: TSchedulerQueueEntry[] = [];

    /** @description Render entries deferred until the following scheduler cycle. */
    #nextRenderEntries: TSchedulerQueueEntry[] = [];

    /** @description Active or most recently completed phase of the current cycle. */
    #activePhase: TSchedulerPhase | null = null;

    /** @description Whether an outer synchronous flush is currently draining work. */
    #flushing = false;

    /** @description Whether this scheduler has permanently released its queues. */
    #disposed = false;

    /** @description Ownership service used to capture and restore semantic job owners. */
    readonly #ownership: OwnershipManager;

    /** @description Semantic owners permanently associated with scheduled job identities. */
    readonly #owners = new WeakMap<ISchedulerJob, ScopeRuntime | null>();

    /** @description Current pending appearance indexed by job identity for deduplication. */
    readonly #pending = new Map<ISchedulerJob, TSchedulerQueueEntry>();

    /**
     * @description Creates a scheduler integrated with one runtime ownership manager.
     * @param ownership - Ownership service used to capture and restore semantic job owners.
     */
    constructor(ownership: OwnershipManager) {
        this.#ownership = ownership;
    }

    /**
     * @description Cancels the current pending appearance of a job if one exists.
     * @param job - Identity-bearing job whose pending queue entry is removed.
     * @returns Nothing.
     */
    cancel(job: ISchedulerJob): void {
        const entry = this.#pending.get(job);

        if (entry === undefined) {
            return;
        }

        entry.cancelled = true;
        this.#pending.delete(job);
    }

    /**
     * @description Permanently cancels and releases every pending scheduler entry.
     * @remarks Disposal is idempotent and prevents future jobs from being enqueued.
     * @returns Nothing.
     */
    dispose(): void {
        if (this.#disposed) {
            return;
        }

        this.#disposed = true;
        this.#clear();
    }

    /**
     * @description Enqueues a job once in the earliest scheduler cycle allowed by phase state.
     * @param job - Identity-bearing synchronous render or effect job.
     * @returns Nothing.
     */
    enqueue(job: ISchedulerJob): void {
        if (this.#disposed) {
            throw new Error("Cannot enqueue work on a disposed scheduler.");
        }

        if (this.#pending.has(job)) {
            return;
        }

        if (!this.#owners.has(job)) {
            this.#owners.set(job, this.#ownership.captureOwner());
        }

        const entry: TSchedulerQueueEntry = {
            cancelled: false,
            job,
        };

        this.#pending.set(job, entry);
        this.#queueFor(job.phase).push(entry);
    }

    /**
     * @description Synchronously drains all current and reentrant scheduler work.
     * @remarks Recursive flush calls are ignored. Handled job failures continue execution;
     * unhandled failures and the cycle limit clear every pending appearance before returning.
     * @returns Nothing.
     */
    flush(): void {
        if (this.#disposed || this.#flushing) {
            return;
        }

        this.#flushing = true;
        let cycleCount = 0;

        try {
            while (this.#hasCurrentEntries()) {
                cycleCount += 1;
                this.#activePhase = "render";
                this.#drain(this.#currentRenderEntries);
                this.#activePhase = "effect";
                this.#drain(this.#currentEffectEntries);

                if (!this.#hasNextEntries()) {
                    break;
                }

                if (cycleCount >= SCHEDULER_CYCLE_LIMIT) {
                    const owner = this.#firstNextOwner();
                    this.#clear();
                    this.#ownership.executeOwned(owner, () => {
                        throw new Error(
                            `Reactive scheduler exceeded the ${SCHEDULER_CYCLE_LIMIT}-cycle flush limit.`,
                        );
                    });
                    break;
                }

                this.#advanceCycle();
            }
        } catch (error) {
            this.#clear();
            throw error;
        } finally {
            this.#activePhase = null;
            this.#flushing = false;
        }
    }

    /**
     * @description Moves deferred entries into a fresh current scheduler cycle.
     * @returns Nothing.
     */
    #advanceCycle(): void {
        this.#currentRenderEntries = this.#nextRenderEntries;
        this.#currentEffectEntries = this.#nextEffectEntries;
        this.#nextRenderEntries = [];
        this.#nextEffectEntries = [];
        this.#activePhase = null;
    }

    /**
     * @description Cancels and releases every pending queue entry after an aborted flush.
     * @returns Nothing.
     */
    #clear(): void {
        for (const entry of this.#pending.values()) {
            entry.cancelled = true;
        }

        this.#pending.clear();
        this.#currentRenderEntries = [];
        this.#currentEffectEntries = [];
        this.#nextRenderEntries = [];
        this.#nextEffectEntries = [];
    }

    /**
     * @description Executes every non-cancelled entry in one phase queue in FIFO order.
     * @param entries - Mutable phase queue being consumed.
     * @returns Nothing.
     */
    #drain(entries: TSchedulerQueueEntry[]): void {
        for (const entry of entries) {
            if (entry.cancelled || this.#pending.get(entry.job) !== entry) {
                continue;
            }

            this.#pending.delete(entry.job);
            const owner = this.#owners.get(entry.job) ?? null;
            this.#ownership.executeOwned(owner, () => entry.job.execute());
        }

        entries.length = 0;
    }

    /**
     * @description Finds the semantic owner of the first live job in the next cycle.
     * @returns The next job owner, or the runtime root when no live entry remains.
     */
    #firstNextOwner(): ScopeRuntime | null {
        for (const entry of [...this.#nextRenderEntries, ...this.#nextEffectEntries]) {
            if (!entry.cancelled && this.#pending.get(entry.job) === entry) {
                return this.#owners.get(entry.job) ?? null;
            }
        }

        return null;
    }

    /**
     * @description Reports whether the current scheduler cycle contains queue entries.
     * @returns Whether current render or effect work remains represented.
     */
    #hasCurrentEntries(): boolean {
        return this.#currentRenderEntries.length > 0
            || this.#currentEffectEntries.length > 0;
    }

    /**
     * @description Reports whether reentrant work is waiting for another scheduler cycle.
     * @returns Whether next-cycle render or effect work remains represented.
     */
    #hasNextEntries(): boolean {
        return this.#nextRenderEntries.length > 0
            || this.#nextEffectEntries.length > 0;
    }

    /**
     * @description Selects the earliest valid queue for a job phase at current progression.
     * @param phase - Scheduler phase declared by the enqueued job.
     * @returns Mutable queue that must receive the new entry.
     */
    #queueFor(phase: TSchedulerPhase): TSchedulerQueueEntry[] {
        if (!this.#flushing || this.#activePhase === null) {
            return phase === "render"
                ? this.#currentRenderEntries
                : this.#currentEffectEntries;
        }

        if (this.#activePhase === "render" && phase === "effect") {
            return this.#currentEffectEntries;
        }

        return phase === "render"
            ? this.#nextRenderEntries
            : this.#nextEffectEntries;
    }
}
