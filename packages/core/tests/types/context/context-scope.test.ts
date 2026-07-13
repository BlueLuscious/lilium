import type { IContextScope } from "../../../src/context/contracts/internal/index.js";
import type { TContextResolution } from "../../../src/context/types/internal/index.js";
import type { ContextIdentity } from "../../../src/index.js";

declare const context: ContextIdentity<string | undefined>;
declare const scope: IContextScope;

scope.provideContext(context, undefined);

const resolution: TContextResolution<string | undefined> = scope.resolveContext(context);

if (resolution.found) {
    const value: string | undefined = resolution.value;
    void value;
} else {
    // @ts-expect-error Missing resolutions do not contain a value property.
    resolution.value;
}

// @ts-expect-error Provider values must match their context identity.
scope.provideContext(context, 1);
