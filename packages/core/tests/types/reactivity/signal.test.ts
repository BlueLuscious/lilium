import type {
    ReactiveRuntime,
    ReadonlySignal,
    Signal,
    SignalEqualityType,
    SignalOptionsType,
    SignalUpdaterType,
} from "../../../src/index.js";

declare const signal: Signal<number>;
declare const runtime: ReactiveRuntime;

const currentValue: number = signal.get();
const updater: SignalUpdaterType<number> = (value) => value + 1;

signal.set(1);
signal.update(updater);

const defaultSignal: Signal<number> = runtime.signal(0);
const equality: SignalEqualityType<number> = (current, next) => current === next;
const options: SignalOptionsType<number> = { equals: equality };
const configuredSignal: Signal<number> = runtime.signal(0, options);

const inferredSignal = runtime.signal(
    { id: "initial" },
    { equals: (current, next) => current.id === next.id },
);

const inferredId: string = inferredSignal.get().id;

const readonlySignal: ReadonlySignal<number> = signal;
const readonlyValue: number = readonlySignal.get();

// @ts-expect-error A read-only signal cannot be mutated.
readonlySignal.set(1);

// @ts-expect-error A signal only accepts values of its generic type.
signal.set("1");

// @ts-expect-error An updater must preserve the signal value type.
signal.update(() => "1");

// @ts-expect-error Signal options are immutable after creation.
options.equals = Object.is;

// @ts-expect-error An equality function must return a boolean.
runtime.signal(0, { equals: () => "equal" });

void currentValue;
void defaultSignal;
void configuredSignal;
void inferredId;
void readonlyValue;
