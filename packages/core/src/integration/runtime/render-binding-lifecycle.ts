import type { OwnershipManager } from "../../ownership/runtime/ownership.manager.js";
import type { ScopeRuntime } from "../../ownership/runtime/scope.runtime.js";
import type {
    IReactiveConsumer,
    // biome-ignore lint/correctness/noUnusedImports: The unique symbol brands a declare-only property.
    REACTIVE_CONSUMER_BRAND,
} from "../../reactivity/contracts/internal/tracking/reactive-consumer.contract.js";
import type { IReactiveRuntimeContext } from "../../reactivity/contracts/internal/tracking/reactive-runtime-context.contract.js";
import type {
    ISchedulerJob,
    // biome-ignore lint/correctness/noUnusedImports: The unique symbol brands a declare-only property.
    SCHEDULER_JOB_BRAND,
} from "../../scheduler/contracts/internal/scheduler-job.contract.js";
import type { RenderBindingFunctionType } from "../types/render-binding-function.type.js";
import type { RenderBindingTerminalFunctionType } from "../types/render-binding-terminal-function.type.js";

/**
 * @description Internal owned implementation of one scheduled reactive render binding.
 * @remarks The binding is both a dependency consumer and a render-phase scheduler job. Failures
 * permanently disconnect it before terminalization is deferred through ownership.
 */
export class RenderBindingLifecycle implements IReactiveConsumer, ISchedulerJob {
    /** @description Type-only identity required by the internal reactive consumer role. */
    declare readonly [REACTIVE_CONSUMER_BRAND]: true;

    /** @description Type-only identity required by the internal scheduler job role. */
    declare readonly [SCHEDULER_JOB_BRAND]: true;

    /** @description Scheduler phase permanently assigned to render binding work. */
    readonly phase = "render" as const;

    /** @description Whether this binding has permanently disconnected and cancelled work. */
    #disposed = false;

    /** @description Whether one binding failure has already requested terminal settlement. */
    #terminal = false;

    /** @description Captured semantic owner permanently associated with this binding. */
    readonly #owner: ScopeRuntime | null;

    /** @description Ownership service coordinating cleanup and deferred failure settlement. */
    readonly #ownership: OwnershipManager;

    /** @description Synchronous tracked render operation represented by this identity. */
    readonly #operation: RenderBindingFunctionType;

    /** @description Renderer finalizer invoked once after failed owned work unwinds. */
    readonly #terminalize: RenderBindingTerminalFunctionType;

    /** @description Runtime context owning this binding's graph and scheduler state. */
    readonly runtime: IReactiveRuntimeContext;

    /**
     * @description Creates and synchronously initializes one owned render binding.
     * @param runtime - Runtime context owning graph and scheduler operations.
     * @param ownership - Ownership service receiving the binding disposer.
     * @param operation - Synchronous tracked render work.
     * @param terminalize - Renderer callback for terminal binding failure.
     * @returns The initialized binding, or `undefined` after a handled initial failure.
     */
    static create(
        runtime: IReactiveRuntimeContext,
        ownership: OwnershipManager,
        operation: RenderBindingFunctionType,
        terminalize: RenderBindingTerminalFunctionType,
    ): RenderBindingLifecycle | undefined {
        const binding = new RenderBindingLifecycle(runtime, ownership, operation, terminalize);
        return binding.#initialize() ? binding : undefined;
    }

    /**
     * @description Constructs one binding and registers its idempotent owned cleanup.
     * @param runtime - Runtime context owning graph and scheduler operations.
     * @param ownership - Ownership service receiving the binding disposer.
     * @param operation - Synchronous tracked render work.
     * @param terminalize - Renderer callback for terminal binding failure.
     */
    private constructor(
        runtime: IReactiveRuntimeContext,
        ownership: OwnershipManager,
        operation: RenderBindingFunctionType,
        terminalize: RenderBindingTerminalFunctionType,
    ) {
        this.runtime = runtime;
        this.#ownership = ownership;
        this.#owner = ownership.captureOwner();
        this.#operation = operation;
        this.#terminalize = terminalize;
        ownership.own(() => {
            this.#dispose();
            return undefined;
        });
        Object.freeze(this);
    }

    /**
     * @description Permanently cancels pending work and disconnects reactive dependencies.
     * @returns Nothing.
     */
    dispose(): void {
        this.#dispose();
    }

    /**
     * @description Executes one scheduled tracked render attempt.
     * @returns `undefined` after success, failure settlement, or a disposed-job skip.
     */
    execute(): undefined {
        if (!this.#disposed) {
            this.#attempt();
        }

        return undefined;
    }

    /**
     * @description Enqueues this binding once after a connected source invalidates it.
     * @returns Nothing.
     */
    invalidate(): void {
        if (!this.#disposed) {
            this.runtime.scheduler.enqueue(this);
        }
    }

    /**
     * @description Performs the synchronous first evaluation under the captured semantic owner.
     * @returns Whether initial evaluation completed successfully.
     */
    #initialize(): boolean {
        let initialized = false;

        this.#ownership.executeOwned(this.#owner, () => {
            initialized = this.#attempt();
            return undefined;
        });

        return initialized;
    }

    /**
     * @description Tracks one render attempt and terminalizes the binding after failure.
     * @returns Whether the operation completed successfully.
     */
    #attempt(): boolean {
        try {
            this.runtime.tracker.collect(this, () => {
                const result = this.#operation();

                if (result !== undefined) {
                    throw new TypeError("Render binding operations must return undefined.");
                }

                return undefined;
            });
            return true;
        } catch (error) {
            this.#fail(error);
            return false;
        }
    }

    /**
     * @description Permanently cancels this binding and defers one terminal failure settlement.
     * @param error - Original render operation failure.
     * @returns Nothing.
     */
    #fail(error: unknown): void {
        if (this.#terminal) {
            return;
        }

        this.#terminal = true;
        this.#dispose();
        this.#ownership.deferFailure(this.#owner, error, () => this.#terminalize(error));
    }

    /**
     * @description Idempotently cancels scheduling and disconnects every dependency edge.
     * @returns Nothing.
     */
    #dispose(): void {
        if (this.#disposed) {
            return;
        }

        this.#disposed = true;
        this.runtime.scheduler.cancel(this);
        this.runtime.tracker.disconnect(this);
    }
}
