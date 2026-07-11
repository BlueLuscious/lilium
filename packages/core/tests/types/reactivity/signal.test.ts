import type {
    ReadonlySignal,
    Signal,
    SignalUpdaterType,
} from "../../../src/index.js";

declare const signal: Signal<number>;

const currentValue: number = signal.get();
const updater: SignalUpdaterType<number> = (value) => value + 1;

signal.set(1);
signal.update(updater);

const readonlySignal: ReadonlySignal<number> = signal;
const readonlyValue: number = readonlySignal.get();

// @ts-expect-error A read-only signal cannot be mutated.
readonlySignal.set(1);

// @ts-expect-error A signal only accepts values of its generic type.
signal.set("1");

// @ts-expect-error An updater must preserve the signal value type.
signal.update(() => "1");

void currentValue;
void readonlyValue;
