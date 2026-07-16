import type { ReactiveRuntime } from "../../../src/index.js";
import type {
    CoreIntegrationApi,
    RenderBinding,
    RenderBindingFunctionType,
    RenderBindingRuntime,
    RenderBindingTerminalFunctionType,
} from "../../../src/integration/index.js";
import { CoreIntegration } from "../../../src/integration/index.js";

// @ts-expect-error Integration authority is not exported from the Core package root.
type RootCoreIntegrationApi = import("../../../src/index.js").CoreIntegrationApi;

declare const api: CoreIntegrationApi;
declare const rootApi: RootCoreIntegrationApi;
declare const runtime: ReactiveRuntime;

const bindingRuntime: RenderBindingRuntime = api.createRuntime(runtime);
const concreteApi: CoreIntegrationApi = CoreIntegration;
const operation: RenderBindingFunctionType = () => undefined;
const terminalize: RenderBindingTerminalFunctionType = (_error: unknown) => undefined;
const binding: RenderBinding | undefined = bindingRuntime.create(operation, terminalize);

// @ts-expect-error Render consumers cannot select scheduler phases.
bindingRuntime.create(operation, terminalize, "render");

// @ts-expect-error The integration runtime does not expose scheduler mutation.
bindingRuntime.flush();

if (binding !== undefined) {
    binding.dispose();

    // @ts-expect-error A binding cannot be executed manually.
    binding.run();

    // @ts-expect-error A binding cannot be invalidated manually.
    binding.invalidate();
}

void rootApi;
void concreteApi;
