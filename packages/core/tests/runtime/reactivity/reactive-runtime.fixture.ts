import { OwnershipManager } from "../../../src/ownership/runtime/ownership.manager.js";
import type { IReactiveConsumer } from "../../../src/reactivity/contracts/internal/tracking/reactive-consumer.contract.js";
import type { IReactiveRuntimeContext } from "../../../src/reactivity/contracts/internal/tracking/reactive-runtime-context.contract.js";
import { BatchingManager } from "../../../src/reactivity/runtime/batching/batching.manager.js";
import { ComputedRuntime } from "../../../src/reactivity/runtime/computed/computed.runtime.js";
import { EffectRuntime } from "../../../src/reactivity/runtime/effect/effect.runtime.js";
import { ReactiveTrackerRuntime } from "../../../src/reactivity/runtime/reactive-tracker.runtime.js";
import { SignalRuntime } from "../../../src/reactivity/runtime/signal/signal.runtime.js";
import type { BatchFunctionType } from "../../../src/reactivity/types/batching/batch-function.type.js";
import type { ComputedFunctionType } from "../../../src/reactivity/types/computed/computed-function.type.js";
import type { EffectFunctionType } from "../../../src/reactivity/types/effect/effect-function.type.js";
import type { SignalOptionsType } from "../../../src/reactivity/types/signal/signal-options.type.js";
import { SchedulerRuntime } from "../../../src/scheduler/runtime/scheduler.runtime.js";

export class TestReactiveRuntime implements IReactiveRuntimeContext {
    readonly tracker = new ReactiveTrackerRuntime();

    readonly ownership = new OwnershipManager((operation) => this.tracker.untrack(operation));

    readonly scheduler = new SchedulerRuntime(this.ownership);

    readonly batching = new BatchingManager(this.scheduler);

    batch(operation: BatchFunctionType): void {
        this.batching.batch(operation);
    }

    computed<T>(computation: ComputedFunctionType<T>): ComputedRuntime<T> {
        return new ComputedRuntime(this, this.ownership, computation);
    }

    effect(effect: EffectFunctionType): EffectRuntime {
        return new EffectRuntime(this, this.ownership, effect);
    }

    requestFlush(): void {
        this.batching.requestFlush();
    }

    signal<T>(initialValue: T, options?: SignalOptionsType<T>): SignalRuntime<T> {
        return new SignalRuntime(this, this.ownership, initialValue, options);
    }
}

export class TestReactiveConsumer {
    invalidations = 0;

    constructor(readonly runtime: IReactiveRuntimeContext) {}

    get identity(): IReactiveConsumer {
        return this as unknown as IReactiveConsumer;
    }

    invalidate(): void {
        this.invalidations += 1;
    }
}
