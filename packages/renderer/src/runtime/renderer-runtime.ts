import type { ComponentInputValuesType } from "@lilium/component";
import type { ReactiveRuntime, Scope } from "@lilium/core";
import { CoreIntegration } from "@lilium/core/integration";
import type { TemplateDefinition, TemplatedComponentDefinition } from "@lilium/template";
import type { RenderedComponent as RenderedComponentContract } from "../application/contracts/rendered-component.contract.js";
import type { RenderedTemplate as RenderedTemplateContract } from "../application/contracts/rendered-template.contract.js";
import { RenderedComponent } from "../application/runtime/rendered-component.js";
import { RenderedTemplate } from "../application/runtime/rendered-template.js";
import { RendererApplicationLifecycle } from "../application/runtime/renderer-application.lifecycle.js";
import { RendererInstructionExecutor } from "../execution/runtime/renderer-instruction.executor.js";
import type { RendererHost } from "../host/contracts/renderer-host.contract.js";
import type { RendererSession } from "../session/runtime/renderer-session.js";
import { RendererSessionManager } from "../session/runtime/renderer-session.manager.js";
import { RendererCleanupCollector } from "../shared/runtime/renderer-cleanup.collector.js";
import type { RendererRuntime as RendererRuntimeContract } from "./contracts/renderer-runtime.contract.js";
import type { RendererComponentMountOptionsType } from "./types/renderer-component-mount-options.type.js";
import type { RendererTemplateMountOptionsType } from "./types/renderer-template-mount-options.type.js";

/**
 * @description Reusable target-independent implementation of public Renderer mount orchestration.
 * @typeParam Root - External host root type accepted by the configured adapter.
 * @typeParam Parent - Opaque host handle shape that may contain rendered values.
 * @typeParam Value - Opaque host value shape created by primitive capabilities.
 */
export class RendererRuntime<Root, Parent extends object, Value extends Parent>
    implements RendererRuntimeContract<Root>
{
    /** @description Externally owned Core runtime coordinating every mounted application. */
    readonly #runtime: ReactiveRuntime;
    /** @description Reusable manager opening exclusive sessions through the configured host. */
    readonly #sessions: RendererSessionManager<Root, Parent, Value>;

    /**
     * @description Validates dependencies and creates one frozen reusable Renderer runtime.
     * @typeParam Root - External host root type accepted by the configured adapter.
     * @typeParam Parent - Opaque host handle shape that may contain rendered values.
     * @typeParam Value - Opaque host value shape created by primitive capabilities.
     * @param runtime - Genuine live Core runtime retained without ownership transfer.
     * @param host - Reusable synchronous host adapter retained without ownership transfer.
     * @returns A frozen Renderer runtime bound to the supplied dependencies.
     */
    static create<Root, Parent extends object, Value extends Parent>(
        runtime: ReactiveRuntime,
        host: RendererHost<Root, Parent, Value>,
    ): RendererRuntimeContract<Root> {
        CoreIntegration.createRuntime(runtime);

        if (typeof host !== "object" || host === null || Array.isArray(host)) {
            throw new TypeError("A Renderer host must be a non-array object.");
        }

        if (typeof Reflect.get(host, "open") !== "function") {
            throw new TypeError("A Renderer host must expose a synchronous open function.");
        }

        return new RendererRuntime(runtime, host);
    }

    /**
     * @description Retains validated dependencies without taking ownership.
     * @param runtime - Genuine live Core runtime used by mounted applications.
     * @param host - Validated reusable host adapter used by session management.
     */
    private constructor(runtime: ReactiveRuntime, host: RendererHost<Root, Parent, Value>) {
        this.#runtime = runtime;
        this.#sessions = new RendererSessionManager(host);
        Object.freeze(this);
    }

    /**
     * @description Mounts one standalone Template with deterministic rollback and cleanup.
     * @typeParam State - Read-only state retained by the Template occurrence.
     * @param definition - Exact normalized Template program to preflight and execute.
     * @param options - External root, state object, and optional parent scope.
     * @returns A mounted Template handle, or undefined after a handled initial failure.
     */
    mountTemplate<State extends object>(
        definition: TemplateDefinition<State>,
        options: RendererTemplateMountOptionsType<Root, State>,
    ): RenderedTemplateContract<State> | undefined {
        this.#assertOptions(options);
        this.#assertRecord(options.state, "Template state");
        const applicationScope =
            options.owner === undefined
                ? this.#runtime.scope()
                : this.#runtime.scope(options.owner);
        const session = this.#open(options.root, applicationScope);

        if (session === undefined) {
            applicationScope.dispose();
            return undefined;
        }

        const lifecycle = new RendererApplicationLifecycle(
            this.#runtime,
            applicationScope,
            session,
        );
        let rendered: RenderedTemplateContract<State> | undefined;

        try {
            this.#runtime.batch(() => {
                let preflighted = false;
                applicationScope.run(() => {
                    session.preflightTemplate(definition);
                    preflighted = true;
                });

                if (!preflighted) {
                    lifecycle.dispose();
                    return;
                }

                const executor = new RendererInstructionExecutor(session, this.#runtime, () =>
                    lifecycle.dispose(),
                );
                const occurrence = executor.executeTemplate(
                    definition,
                    options.state,
                    lifecycle.resources,
                );

                if (occurrence === undefined) {
                    lifecycle.dispose();
                    return;
                }

                lifecycle.attach(occurrence);
                rendered = new RenderedTemplate(lifecycle, options.state);
            });
        } catch (error) {
            this.#failMount(error, lifecycle);
        }

        return rendered;
    }

    /**
     * @description Mounts one templated root Component with protected update authority.
     * @typeParam Inputs - Complete root Component input value shape.
     * @typeParam Controller - Public controller returned by Component setup.
     * @param definition - Exact immutable Component and Template composition.
     * @param options - External root, complete inputs, and optional parent scope.
     * @returns A mounted Component handle, or undefined after a handled initial failure.
     */
    mountComponent<Inputs extends object, Controller extends object>(
        definition: TemplatedComponentDefinition<Inputs, Controller>,
        options: RendererComponentMountOptionsType<Root, Inputs>,
    ): RenderedComponentContract<Inputs, Controller> | undefined {
        this.#assertOptions(options);
        this.#assertRecord(options.inputs, "Component input values");
        const applicationScope =
            options.owner === undefined
                ? this.#runtime.scope()
                : this.#runtime.scope(options.owner);
        const session = this.#open(options.root, applicationScope);

        if (session === undefined) {
            applicationScope.dispose();
            return undefined;
        }

        const lifecycle = new RendererApplicationLifecycle(
            this.#runtime,
            applicationScope,
            session,
        );
        let rendered: RenderedComponentContract<Inputs, Controller> | undefined;

        try {
            this.#runtime.batch(() => {
                let preflighted = false;
                applicationScope.run(() => {
                    session.preflightComponent(definition);
                    preflighted = true;
                });

                if (!preflighted) {
                    lifecycle.dispose();
                    return;
                }

                const executor = new RendererInstructionExecutor(session, this.#runtime, () =>
                    lifecycle.dispose(),
                );
                const occurrence = executor.executeComponent(
                    definition,
                    options.inputs as ComponentInputValuesType<Inputs>,
                    lifecycle.resources,
                );

                if (occurrence === undefined) {
                    lifecycle.dispose();
                    return;
                }

                lifecycle.attach(occurrence);
                rendered = new RenderedComponent(lifecycle, occurrence);
            });
        } catch (error) {
            this.#failMount(error, lifecycle);
        }

        return rendered;
    }

    /**
     * @description Opens one session under application ownership and preserves handled failures.
     * @param root - External host root claimed by this mount attempt.
     * @param owner - Dedicated application scope used for opening error routing.
     * @returns The opened session, or undefined when an opening failure is handled.
     */
    #open(root: Root, owner: Scope): RendererSession<Parent, Value> | undefined {
        let session: RendererSession<Parent, Value> | undefined;

        try {
            owner.run(() => {
                session = this.#sessions.open(root);
            });
        } catch (error) {
            const cleanup = new RendererCleanupCollector();
            cleanup.add(error);
            cleanup.attempt(() => owner.dispose());
            cleanup.throwIfAny("Renderer session opening and ownership cleanup failed.");
        }

        return session;
    }

    /**
     * @description Adds terminal cleanup failures after one propagated mount failure.
     * @param error - Original preflight, construction, placement, or scheduling failure.
     * @param lifecycle - Partial application lifecycle requiring terminal cleanup.
     * @returns Never after preserving deterministic failure order.
     */
    #failMount(error: unknown, lifecycle: RendererApplicationLifecycle<Parent, Value>): never {
        const cleanup = new RendererCleanupCollector();
        cleanup.add(error);
        cleanup.attempt(() => lifecycle.dispose());
        cleanup.throwIfAny("Renderer mount and terminal cleanup failed.");
        throw new Error("Renderer mount failure collection produced no failure.");
    }

    /**
     * @description Validates the common object shape of public mount options.
     * @param options - Unknown public mount options candidate.
     * @returns Nothing when options are a non-array object.
     */
    #assertOptions(options: object): void {
        this.#assertRecord(options, "Renderer mount options");
    }

    /**
     * @description Rejects null, arrays, and primitive values at public object boundaries.
     * @param candidate - Candidate object supplied by public application code.
     * @param subject - Human-readable subject used by the validation error.
     * @returns Nothing when the candidate is a non-array object.
     */
    #assertRecord(candidate: unknown, subject: string): asserts candidate is object {
        if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) {
            throw new TypeError(`${subject} must be a non-array object.`);
        }
    }
}
