import {
    Context,
    type ContextApi,
    type ContextIdentity,
    type ReactiveRuntime,
    Runtime,
    type RuntimeApi,
    type Scope,
} from "../../../src/index.js";

const contextApi: ContextApi = Context;
const runtimeApi: RuntimeApi = Runtime;

const runtime: ReactiveRuntime = runtimeApi.create();
const requiredContext: ContextIdentity<string> = contextApi.create<string>();
const defaultContext: ContextIdentity<number> = contextApi.create(0);
const undefinedDefaultContext: ContextIdentity<undefined> = contextApi.create(undefined);
const rootScope: Scope = runtime.scope();
const childScope: Scope = runtime.scope(rootScope);

// @ts-expect-error Runtime creation has no public configuration in the foundation.
runtimeApi.create({ schedulerCycles: 10 });

// @ts-expect-error A context default must match its explicit value type.
contextApi.create<number>("zero");

// @ts-expect-error Child scope creation requires a Core scope owner.
runtime.scope({});

void childScope;
void defaultContext;
void requiredContext;
void runtime;
void undefinedDefaultContext;
