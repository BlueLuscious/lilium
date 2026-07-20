import type {
    ComponentDefinition,
    ComponentInputValuesType,
    ComponentInstance,
} from "@lilium/component";
import type { ReactiveRuntime, Scope } from "@lilium/core";
import type {
    ComponentTemplateStateType,
    TemplateDefinition,
    TemplatedComponentDefinition,
} from "@lilium/template";
import type {
    RenderedComponent,
    RenderedTemplate,
    RendererApi,
    RendererComponentMountOptionsType,
    RendererHost,
    RendererRuntime,
    RendererTemplateMountOptionsType,
} from "../../src/index.js";

type RootType = {
    readonly name: string;
};

type ParentHandleType = {
    readonly handle: number;
};

type ValueHandleType = ParentHandleType & {
    readonly value: true;
};

type ViewStateType = {
    readonly title: string;
};

type CardInputsType = {
    title: string;
    subtitle?: string;
};

type CardControllerType = {
    reveal(): void;
};

declare const api: RendererApi;
declare const component: ComponentDefinition<CardInputsType, CardControllerType>;
declare const componentView: TemplateDefinition<
    ComponentTemplateStateType<CardInputsType, CardControllerType>
>;
declare const composition: TemplatedComponentDefinition<CardInputsType, CardControllerType>;
declare const host: RendererHost<RootType, ParentHandleType, ValueHandleType>;
declare const owner: Scope;
declare const root: RootType;
declare const runtime: ReactiveRuntime;
declare const template: TemplateDefinition<ViewStateType>;

const rendererRuntime: RendererRuntime<RootType> = api.createRuntime(runtime, host);
const templateOptions: RendererTemplateMountOptionsType<RootType, ViewStateType> = {
    root,
    state: { title: "Lilium" },
    owner,
};
const renderedTemplate: RenderedTemplate<ViewStateType> | undefined = rendererRuntime.mountTemplate(
    template,
    templateOptions,
);
const inputValues: ComponentInputValuesType<CardInputsType> = {
    subtitle: undefined,
    title: "Renderer",
};
const componentOptions: RendererComponentMountOptionsType<RootType, CardInputsType> = {
    root,
    inputs: inputValues,
};
const renderedComponent: RenderedComponent<CardInputsType, CardControllerType> | undefined =
    rendererRuntime.mountComponent(composition, componentOptions);

if (renderedTemplate !== undefined) {
    const state: Readonly<ViewStateType> = renderedTemplate.state;
    const disposed: boolean = renderedTemplate.disposed;
    renderedTemplate.dispose();
    void disposed;
    void state;
}

if (renderedComponent !== undefined) {
    const instance: ComponentInstance<CardInputsType, CardControllerType> =
        renderedComponent.component;
    renderedComponent.update({ subtitle: "Universal", title: "Renderer" });
    renderedComponent.dispose();
    void instance;
}

rendererRuntime.mountTemplate(template, {
    // @ts-expect-error The configured host determines the accepted external root type.
    root: { invalid: true },
    state: { title: "Invalid root" },
});

rendererRuntime.mountComponent(composition, {
    root,
    // @ts-expect-error Component mounts require complete normalized input snapshots.
    inputs: { subtitle: undefined },
});

// @ts-expect-error A Template definition cannot be mounted as a component composition.
rendererRuntime.mountComponent(template, componentOptions);

void component;
void componentView;
