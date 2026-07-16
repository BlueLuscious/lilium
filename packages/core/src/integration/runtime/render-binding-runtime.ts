import type { OwnershipManager } from "../../ownership/runtime/ownership.manager.js";
import type { ReactiveRuntime as ReactiveRuntimeContract } from "../../reactivity/contracts/reactive-runtime.contract.js";
import { ReactiveRuntime } from "../../reactivity/runtime/reactive-runtime/reactive-runtime.js";
import type { ReactiveRuntimeContext } from "../../reactivity/runtime/reactive-runtime/reactive-runtime-context.js";
import type { RenderBinding as RenderBindingContract } from "../contracts/render-binding.contract.js";
import type { RenderBindingRuntime as RenderBindingRuntimeContract } from "../contracts/render-binding-runtime.contract.js";
import type { RenderBindingFunctionType } from "../types/render-binding-function.type.js";
import type { RenderBindingTerminalFunctionType } from "../types/render-binding-terminal-function.type.js";
import { RenderBinding as RenderBindingImplementation } from "./render-binding.js";
import { RenderBindingLifecycle } from "./render-binding-lifecycle.js";

/**
 * @description Internal frozen implementation of one runtime-bound render integration capability.
 * @remarks It validates callbacks and creates bindings without exposing its private Core context.
 */
export class RenderBindingRuntime implements RenderBindingRuntimeContract {
    /** @description Private Core runtime context used by every created render binding. */
    readonly #context: ReactiveRuntimeContext;

    /** @description Ownership service shared with the connected Core runtime. */
    readonly #ownership: OwnershipManager;

    /**
     * @description Creates a render-binding runtime from one genuine Core runtime.
     * @param runtime - Public runtime candidate supplied through the integration API.
     * @returns A frozen narrow render-binding runtime.
     */
    static create(runtime: ReactiveRuntimeContract): RenderBindingRuntimeContract {
        const context = RenderBindingRuntime.assertRuntime(runtime);
        return new RenderBindingRuntime(context);
    }

    /**
     * @description Verifies a candidate and resolves its private live Core runtime context.
     * @param runtime - Public runtime candidate supplied to an integration API.
     * @returns The private context of one genuine live Core runtime.
     */
    static assertRuntime(runtime: ReactiveRuntimeContract): ReactiveRuntimeContext {
        const context = ReactiveRuntime.contextOf(runtime);
        context.assertOpen("use a reactive runtime for integration");
        return context;
    }

    /**
     * @description Constructs one frozen capability over an existing private runtime context.
     * @param context - Genuine Core runtime context retained without ownership transfer.
     */
    private constructor(context: ReactiveRuntimeContext) {
        this.#context = context;
        this.#ownership = context.ownership;
        Object.freeze(this);
    }

    /**
     * @description Creates and synchronously evaluates one owned reactive render binding.
     * @param operation - Synchronous tracked render work.
     * @param terminalize - Renderer finalizer for terminal binding failure.
     * @returns The live binding, or `undefined` after a handled initial failure.
     */
    create(
        operation: RenderBindingFunctionType,
        terminalize: RenderBindingTerminalFunctionType,
    ): RenderBindingContract | undefined {
        this.#context.assertOpen("create a render binding");

        if (typeof operation !== "function") {
            throw new TypeError("A render binding operation must be a function.");
        }

        if (typeof terminalize !== "function") {
            throw new TypeError("A render binding terminalizer must be a function.");
        }

        const lifecycle = RenderBindingLifecycle.create(
            this.#context,
            this.#ownership,
            operation,
            terminalize,
        );

        return lifecycle === undefined ? undefined : RenderBindingImplementation.create(lifecycle);
    }
}
