import type {
    Computed,
    ComputedFunctionType,
    ReactiveRuntime,
    ReadonlySignal,
} from "../../../src/index.js";

declare const runtime: ReactiveRuntime;

const computation: ComputedFunctionType<number> = () => 1;
const computed: Computed<number> = runtime.computed(computation);
const inferredComputed = runtime.computed(() => ({ value: "derived" }));

const currentValue: number = computed.get();
const inferredValue: string = inferredComputed.get().value;
const readonlyValue: ReadonlySignal<number> = computed;

// @ts-expect-error Computed values do not expose mutation commands.
computed.set(1);

// @ts-expect-error Computed values do not expose update commands.
computed.update((value: number) => value + 1);

// @ts-expect-error The computation result must match the explicit value type.
runtime.computed<number>(() => "invalid");

void currentValue;
void inferredValue;
void readonlyValue;
