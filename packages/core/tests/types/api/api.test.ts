import type {
    Context,
    ContextApi,
    ReactiveRuntime,
    RuntimeApi,
} from "../../../src/index.js";

declare const contextApi: ContextApi;
declare const runtimeApi: RuntimeApi;

const runtime: ReactiveRuntime = runtimeApi.create();
const requiredContext: Context<string> = contextApi.create<string>();
const defaultContext: Context<number> = contextApi.create(0);
const undefinedDefaultContext: Context<undefined> = contextApi.create(undefined);

// @ts-expect-error Runtime creation has no public configuration in the foundation.
runtimeApi.create({ schedulerCycles: 10 });

// @ts-expect-error A context default must match its explicit value type.
contextApi.create<number>("zero");

void defaultContext;
void requiredContext;
void runtime;
void undefinedDefaultContext;
