import type { Scope } from "../../../ownership/contracts/scope/scope.contract.js";
import type { Computed } from "../../contracts/computed/computed.contract.js";
import type { Effect } from "../../contracts/effect/effect.contract.js";
import type { ReactiveRuntime as ReactiveRuntimeContract } from "../../contracts/reactive-runtime.contract.js";
import type { Signal } from "../../contracts/signal/signal.contract.js";
import type { BatchFunctionType } from "../../types/batching/batch-function.type.js";
import type { ComputedFunctionType } from "../../types/computed/computed-function.type.js";
import type { EffectFunctionType } from "../../types/effect/effect-function.type.js";
import type { SignalOptionsType } from "../../types/signal/signal-options.type.js";
import { ComputedRuntime } from "../computed/computed.runtime.js";
import { EffectRuntime } from "../effect/effect.runtime.js";
import { SignalRuntime } from "../signal/signal.runtime.js";
import { ReactiveRuntimeContext } from "./reactive-runtime-context.js";

/**
 * @description Internal immutable public-facing implementation of one reactive runtime.
 * @remarks The object exposes only the {@link ReactiveRuntimeContract} surface and delegates all
 * mutable service state to a private runtime composition context.
 */
export class ReactiveRuntime implements ReactiveRuntimeContract {
    /** @description Private composition root containing this runtime's mutable services. */
    readonly #context = new ReactiveRuntimeContext();

    /**
     * @description Creates one isolated reactive runtime implementation.
     * @returns A frozen runtime object with a fresh internal composition root.
     */
    static create(): ReactiveRuntime {
        return new ReactiveRuntime();
    }

    /** @description Prevents construction outside the canonical internal factory. */
    private constructor() {
        Object.freeze(this);
    }

    /**
     * @description Groups synchronous reactive writes into one scheduling boundary.
     * @param operation - Operation containing immediately applied reactive writes.
     * @returns Nothing.
     */
    batch(operation: BatchFunctionType): void {
        this.#context.batch(operation);
    }

    /**
     * @description Creates a lazy memoized value owned by this runtime.
     * @typeParam T - Type of value produced by the computation.
     * @param computation - Pure tracked operation deriving the computed value.
     * @returns A read-only computed object connected to this runtime.
     */
    computed<T>(computation: ComputedFunctionType<T>): Computed<T> {
        this.#context.assertOpen("create a computed value");
        return new ComputedRuntime(this.#context, this.#context.ownership, computation);
    }

    /**
     * @description Recursively disposes this runtime's resources and pending work.
     * @returns Nothing.
     */
    dispose(): void {
        this.#context.dispose();
    }

    /**
     * @description Creates a scheduled synchronous effect owned by this runtime.
     * @param effect - Tracked callback executed in the scheduler effect phase.
     * @returns A disposable effect connected to this runtime.
     */
    effect(effect: EffectFunctionType): Effect {
        this.#context.assertOpen("create an effect");
        return new EffectRuntime(this.#context, this.#context.ownership, effect);
    }

    /**
     * @description Creates an inactive root or validated child scope for this runtime.
     * @param owner - Optional runtime-owned scope that owns the new child.
     * @returns A scope owned by this runtime's isolated ownership tree.
     */
    scope(owner?: Scope): Scope {
        this.#context.assertOpen("create a scope");
        return this.#context.ownership.scope(owner);
    }

    /**
     * @description Creates a mutable signal owned by this runtime.
     * @typeParam T - Type of value stored by the signal.
     * @param initialValue - Value initially stored by the signal.
     * @param options - Optional equality behavior for signal writes.
     * @returns A mutable signal connected to this runtime.
     */
    signal<T>(initialValue: T, options?: SignalOptionsType<T>): Signal<T> {
        this.#context.assertOpen("create a signal");
        return new SignalRuntime(this.#context, this.#context.ownership, initialValue, options);
    }
}
