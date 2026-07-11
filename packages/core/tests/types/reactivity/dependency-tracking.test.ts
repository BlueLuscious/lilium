import type {
    IReactiveConsumer,
    IReactiveRuntimeContext,
    IReactiveSource,
    IReactiveTracker,
} from "../../../src/reactivity/contracts/internal/index.js";
import type { TReactiveComputation } from "../../../src/reactivity/types/internal/index.js";

declare const consumer: IReactiveConsumer;
declare const runtime: IReactiveRuntimeContext;
declare const source: IReactiveSource;
declare const tracker: IReactiveTracker;

const computation: TReactiveComputation<number> = () => 1;
const result: number = tracker.collect(consumer, computation);
const untrackedResult: number = tracker.untrack(computation);

tracker.track(source);
tracker.invalidate(source);
tracker.disconnect(consumer);
consumer.invalidate();

const consumerRuntime: IReactiveRuntimeContext = consumer.runtime;
const sourceRuntime: IReactiveRuntimeContext = source.runtime;
const runtimeTracker: IReactiveTracker = runtime.tracker;

// @ts-expect-error Collection requires an internal reactive consumer.
tracker.collect(source, computation);

// @ts-expect-error Tracking requires an internal reactive source.
tracker.track(consumer);

void consumerRuntime;
void result;
void runtimeTracker;
void sourceRuntime;
void untrackedResult;
