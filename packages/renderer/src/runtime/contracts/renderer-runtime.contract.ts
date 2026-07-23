import type { TemplateDefinition, TemplatedComponentDefinition } from "@lilium/template";
import type { RenderedComponent } from "../../application/contracts/rendered-component.contract.js";
import type { RenderedTemplate } from "../../application/contracts/rendered-template.contract.js";
import type { RendererComponentMountOptionsType } from "../types/renderer-component-mount-options.type.js";
import type { RendererTemplateMountOptionsType } from "../types/renderer-template-mount-options.type.js";

/**
 * @description Reusable target-independent runtime bound to one Core runtime and host adapter.
 * @remarks Each mount owns an independent Core scope and exclusive host session. This runtime
 * owns neither configured dependency and exposes no host handles or integration capabilities.
 * @typeParam Root - External root type accepted by the configured host.
 */
export interface RendererRuntime<Root> {
    /**
     * @description Mounts one standalone immutable Template definition.
     * @typeParam State - Read-only state object supplied to the Template occurrence.
     * @param definition - Reusable normalized Template program.
     * @param options - External root, occurrence state, and optional parent scope.
     * @returns The rendered lifecycle, or `undefined` when an initial failure is handled.
     */
    mountTemplate<State extends object>(
        definition: TemplateDefinition<State>,
        options: RendererTemplateMountOptionsType<Root, State>,
    ): RenderedTemplate<State> | undefined;

    /**
     * @description Mounts one immutable component-template composition.
     * @typeParam Inputs - Declarative component input value shape.
     * @typeParam Controller - Public controller object returned by setup.
     * @param definition - Reusable compatible Component and Template composition.
     * @param options - External root, complete initial inputs, and optional parent scope.
     * @returns The rendered lifecycle, or `undefined` when an initial failure is handled.
     */
    mountComponent<Inputs extends object, Controller extends object>(
        definition: TemplatedComponentDefinition<Inputs, Controller>,
        options: RendererComponentMountOptionsType<Root, Inputs>,
    ): RenderedComponent<Inputs, Controller> | undefined;
}
