import {
    Context,
    Runtime,
    type Context as ContextContract,
    ContextApi,
    ReactiveRuntime,
    RuntimeApi,
} from "../../../src/index.js";

const contextApi: ContextApi = Context;
const runtimeApi: RuntimeApi = Runtime;

const runtime: ReactiveRuntime = runtimeApi.create();
const requiredContext: ContextContract<string> = contextApi.create<string>();
const defaultContext: ContextContract<number> = contextApi.create(0);
const undefinedDefaultContext: ContextContract<undefined> = contextApi.create(undefined);

// @ts-expect-error Runtime creation has no public configuration in the foundation.
runtimeApi.create({ schedulerCycles: 10 });

// @ts-expect-error A context default must match its explicit value type.
contextApi.create<number>("zero");

void defaultContext;
void requiredContext;
void runtime;
void undefinedDefaultContext;
